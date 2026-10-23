"""
Playwright browser execution engine.

Accepts an approved, validated test plan and executes each step
in an isolated browser context. Never executes raw code generated
by Gemini — only the allow-listed action types are dispatched.
"""

import asyncio
import base64
import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from playwright.async_api import (
    async_playwright,
    Browser,
    BrowserContext,
    Page,
    TimeoutError as PlaywrightTimeout,
)

from app.schemas.test_run import StepStatus, TestPlan

logger = logging.getLogger(__name__)

SCREENSHOTS_DIR = Path("screenshots")
SCREENSHOTS_DIR.mkdir(exist_ok=True)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ms(start: float) -> int:
    return int((time.perf_counter() - start) * 1000)


# ── Action dispatcher ──────────────────────────────────────────────────────────

async def _dispatch_action(
    page: Page,
    action: str,
    target: Optional[str],
    value: Optional[str],
    timeout: int = 10000,
) -> Tuple[bool, str, Optional[str]]:
    """
    Execute a single allowed action.
    Returns (success, observation, error_message).
    """
    try:
        if action == "navigate":
            await page.goto(target or value or "", timeout=timeout, wait_until="domcontentloaded")
            return True, f"Navigated to {target or value}", None

        elif action == "click":
            loc = page.locator(target or "")
            await loc.click(timeout=timeout)
            return True, f"Clicked '{target}'", None

        elif action == "fill":
            loc = page.locator(target or "")
            await loc.fill(value or "", timeout=timeout)
            return True, f"Filled '{target}' with value", None

        elif action == "assert_text":
            loc = page.locator(target or "")
            await loc.wait_for(state="visible", timeout=timeout)
            text = await loc.inner_text()
            if value and value.lower() not in text.lower():
                return False, f"Expected text '{value}' not found. Actual: '{text[:200]}'", None
            return True, f"Text assertion passed: '{text[:100]}'", None

        elif action == "assert_visible":
            loc = page.locator(target or "")
            await loc.wait_for(state="visible", timeout=timeout)
            return True, f"Element '{target}' is visible", None

        elif action == "assert_not_visible":
            loc = page.locator(target or "")
            visible = await loc.is_visible()
            if visible:
                return False, f"Element '{target}' is visible but should not be", None
            return True, f"Element '{target}' is not visible as expected", None

        elif action == "assert_url":
            current = page.url
            if value and value.lower() not in current.lower():
                return False, f"URL mismatch. Expected '{value}', got '{current}'", None
            return True, f"URL assertion passed: {current}", None

        elif action == "read_text":
            loc = page.locator(target or "body")
            text = await loc.inner_text()
            return True, f"Read text: '{text[:300]}'", None

        elif action == "check_element":
            loc = page.locator(target or "")
            visible = await loc.is_visible()
            return True, f"Element '{target}' visible: {visible}", None

        elif action == "screenshot":
            return True, "Screenshot captured", None  # handled outside

        elif action == "wait":
            ms = int(value or "1000")
            ms = min(ms, 5000)  # cap at 5s
            await asyncio.sleep(ms / 1000)
            return True, f"Waited {ms}ms", None

        elif action == "select_option":
            loc = page.locator(target or "")
            await loc.select_option(value or "", timeout=timeout)
            return True, f"Selected '{value}' in '{target}'", None

        elif action == "press_key":
            await page.keyboard.press(value or "Enter")
            return True, f"Pressed key '{value}'", None

        elif action == "hover":
            loc = page.locator(target or "")
            await loc.hover(timeout=timeout)
            return True, f"Hovered over '{target}'", None

        elif action == "scroll":
            await page.evaluate("window.scrollBy(0, 500)")
            return True, "Scrolled page", None

        else:
            return False, f"Unknown action '{action}'", f"Action '{action}' is not in the allow-list."

    except PlaywrightTimeout:
        return False, f"Timeout waiting for '{target}'", f"PlaywrightTimeout on action '{action}'"
    except Exception as exc:
        return False, f"Error: {exc}", str(exc)


# ── Screenshot helper ──────────────────────────────────────────────────────────

async def _capture_screenshot(page: Page, run_id: str, step_id: str) -> Optional[str]:
    try:
        path = SCREENSHOTS_DIR / f"{run_id}_{step_id}.png"
        await page.screenshot(path=str(path), full_page=False)
        with open(path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode()
        return f"data:image/png;base64,{encoded}"
    except Exception as exc:
        logger.warning("Screenshot failed: %s", exc)
        return None


# ── Main executor ─────────────────────────────────────────────────────────────

async def execute_test_plan(
    run_id: str,
    test_plan: TestPlan,
    approved_url: str,
    approved_domains: List[str],
    timeout_seconds: int = 60,
    event_callback=None,
) -> Dict[str, Any]:
    """
    Execute an approved test plan against an approved URL.

    Args:
        run_id: Firestore run document ID.
        test_plan: Validated TestPlan model.
        approved_url: The URL validated against project domains.
        approved_domains: Domains this browser context may visit.
        timeout_seconds: Per-test-case timeout.
        event_callback: async callable(event_dict) for SSE/WS streaming.

    Returns dict with test_case_results and summary.
    """
    async def emit(msg: str, status: str = "info", extra: Optional[Dict] = None):
        if event_callback:
            await event_callback({"timestamp": _now_iso(), "message": msg, "status": status, **(extra or {})})

    await emit("Browser initializing …", "info")

    results: List[Dict[str, Any]] = []
    summary = {"passed": 0, "failed": 0, "blocked": 0, "error": 0, "skipped": 0}

    async with async_playwright() as pw:
        browser: Browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
            ],
        )

        for tc_idx, test_case in enumerate(test_plan.test_cases):
            tc_start = time.perf_counter()
            await emit(f"Running: {test_case.title}", "running", {"test_case_id": test_case.id})

            context: BrowserContext = await browser.new_context(
                viewport={"width": 1280, "height": 800},
                java_script_enabled=True,
                ignore_https_errors=False,
            )

            # Block navigation to non-approved domains
            async def block_unapproved(route, request):
                from urllib.parse import urlparse
                host = urlparse(request.url).hostname or ""
                allowed = any(
                    host == d or host.endswith("." + d)
                    for d in (approved_domains or [])
                )
                # Allow localhost for demo site
                if host in ("localhost", "127.0.0.1") or allowed:
                    await route.continue_()
                else:
                    logger.warning("Blocked navigation to %s", request.url)
                    await route.abort()

            await context.route("**/*", block_unapproved)

            page: Page = await context.new_page()
            console_errors: List[str] = []
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

            step_results: List[Dict[str, Any]] = []
            tc_status = StepStatus.passed
            blocked = False

            for step_idx, step in enumerate(test_case.steps):
                step_id = f"{test_case.id}_S{step_idx+1:02d}"
                step_start = time.perf_counter()
                started_at = _now_iso()

                await emit(f"  Step {step_idx+1}: {step.description}", "step", {"step_id": step_id})

                if blocked:
                    step_result = {
                        "step_id": step_id,
                        "action": step.action,
                        "started_at": started_at,
                        "duration_ms": 0,
                        "status": StepStatus.blocked.value,
                        "expected_result": step.description,
                        "actual_observation": "Blocked due to earlier failure",
                        "error_details": None,
                        "screenshot_url": None,
                    }
                    step_results.append(step_result)
                    summary["blocked"] += 1
                    continue

                success, observation, error = await _dispatch_action(
                    page, step.action, step.target, step.value,
                    timeout=min(timeout_seconds * 1000, 30000),
                )

                screenshot_url: Optional[str] = None
                if step.action == "screenshot" or not success:
                    screenshot_url = await _capture_screenshot(page, run_id, step_id)

                step_status = StepStatus.passed if success else StepStatus.failed
                if not success:
                    tc_status = StepStatus.failed
                    blocked = True

                step_result = {
                    "step_id": step_id,
                    "action": step.action,
                    "started_at": started_at,
                    "duration_ms": _ms(step_start),
                    "status": step_status.value,
                    "expected_result": step.description,
                    "actual_observation": observation,
                    "error_details": error,
                    "screenshot_url": screenshot_url,
                }
                step_results.append(step_result)

                if success:
                    await emit(f"    ✓ {observation[:120]}", "passed", {"step_id": step_id})
                else:
                    await emit(f"    ✗ {observation[:120]}", "failed", {"step_id": step_id})

            await context.close()

            tc_result = {
                "test_case_id": test_case.id,
                "title": test_case.title,
                "objective": test_case.objective,
                "expected_result": test_case.expected_result,
                "status": tc_status.value,
                "duration_ms": _ms(tc_start),
                "step_results": step_results,
                "console_errors": console_errors[:20],
            }
            results.append(tc_result)
            summary[tc_status.value] += 1

            status_emoji = "✓" if tc_status == StepStatus.passed else "✗"
            await emit(
                f"{status_emoji} {test_case.title} — {tc_status.value.upper()}",
                tc_status.value,
                {"test_case_id": test_case.id},
            )

        await browser.close()

    await emit("Browser closed.", "info")
    return {"test_case_results": results, "summary": summary}
