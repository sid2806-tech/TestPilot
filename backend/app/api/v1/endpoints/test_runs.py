"""
Test run endpoints — generate, approve, execute, stream results.
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.core.auth import get_current_user, AuthenticatedUser
from app.core.config import settings
from app.core.url_security import validate_target_url, URLValidationError
from app.schemas.test_run import GenerateTestsRequest, RunStatus, TestPlan
from app.services import firestore_service as fs
from app.services.gemini_service import generate_test_plan, analyze_failure
from app.services.playwright_service import execute_test_plan

logger = logging.getLogger(__name__)
router = APIRouter()

# Simple in-process lock to prevent duplicate simultaneous executions per run
_running_locks: Dict[str, asyncio.Lock] = {}


def _serialize(doc: dict) -> dict:
    result = {}
    for k, v in doc.items():
        if hasattr(v, "isoformat"):
            result[k] = v.isoformat()
        elif isinstance(v, dict):
            result[k] = _serialize(v)
        else:
            result[k] = v
    return result


# ── Generate test plan ────────────────────────────────────────────────────────

@router.post("/generate", response_model=dict, status_code=status.HTTP_201_CREATED)
async def generate_tests(
    body: GenerateTestsRequest,
    user: AuthenticatedUser = Depends(get_current_user),
):
    # Verify project ownership
    project = fs.get_project(body.project_id, user.uid)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    # Validate URL against project's approved domains
    try:
        validated_url = validate_target_url(body.target_url, project.get("approved_domains", []))
    except URLValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # Create run document (status: generating)
    run_doc = fs.create_run(user.uid, {
        "project_id": body.project_id,
        "test_name": body.test_name,
        "target_url": validated_url,
        "requirements": body.requirements,
        "category": body.category.value,
        "status": RunStatus.generating.value,
        "timeout_seconds": body.timeout_seconds,
    })
    run_id = run_doc["id"]

    # Generate test plan via Gemini
    try:
        plan: TestPlan = generate_test_plan(
            url=validated_url,
            requirements=body.requirements,
            category=body.category.value,
        )
    except Exception as exc:
        fs.update_run(run_id, {"status": RunStatus.failed.value, "error": str(exc)})
        raise HTTPException(status_code=502, detail=f"AI generation failed: {exc}")

    # Store plan, update status to awaiting_approval
    plan_dict = plan.model_dump()
    fs.update_run(run_id, {
        "status": RunStatus.awaiting_approval.value,
        "test_plan": plan_dict,
    })

    return {"run_id": run_id, "status": RunStatus.awaiting_approval.value, "test_plan": plan_dict}


# ── Execute approved run ──────────────────────────────────────────────────────

@router.post("/{run_id}/execute")
async def execute_run(
    run_id: str,
    background_tasks: BackgroundTasks,
    user: AuthenticatedUser = Depends(get_current_user),
):
    run = fs.get_run(run_id, user.uid)
    if not run:
        raise HTTPException(status_code=404, detail="Test run not found.")
    if run["status"] not in (RunStatus.awaiting_approval.value, RunStatus.failed.value):
        raise HTTPException(status_code=409, detail=f"Run is already in status '{run['status']}'.")
    if not run.get("test_plan"):
        raise HTTPException(status_code=400, detail="Run has no approved test plan.")

    # Prevent duplicate execution
    if run_id in _running_locks:
        raise HTTPException(status_code=409, detail="Run is already executing.")

    project = fs.get_project(run["project_id"], user.uid)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    fs.update_run(run_id, {
        "status": RunStatus.running.value,
        "started_at": datetime.now(timezone.utc),
    })

    background_tasks.add_task(_run_in_background, run_id, run, project, user.uid)
    return {"run_id": run_id, "status": RunStatus.running.value}


async def _run_in_background(run_id: str, run: dict, project: dict, owner_id: str):
    lock = asyncio.Lock()
    _running_locks[run_id] = lock
    try:
        async with lock:
            plan = TestPlan.model_validate(run["test_plan"])
            approved_domains = project.get("approved_domains", [])
            # Allow localhost for demo
            if "localhost" not in approved_domains:
                approved_domains = approved_domains + ["localhost", "127.0.0.1"]

            async def emit(event: dict):
                fs.add_run_event(run_id, event)

            result = await execute_test_plan(
                run_id=run_id,
                test_plan=plan,
                approved_url=run["target_url"],
                approved_domains=approved_domains,
                timeout_seconds=run.get("timeout_seconds", 60),
                event_callback=emit,
            )

            # Persist results
            for tc_result in result["test_case_results"]:
                fs.save_test_case_result(run_id, tc_result)

            # Generate bug reports for failures
            for tc_result in result["test_case_results"]:
                if tc_result["status"] in ("failed", "error"):
                    failed_step = next(
                        (s for s in tc_result.get("step_results", []) if s["status"] in ("failed", "error")),
                        None,
                    )
                    ai = analyze_failure(
                        objective=tc_result.get("objective", ""),
                        expected_result=tc_result.get("expected_result", ""),
                        actual_observation=failed_step.get("actual_observation", "") if failed_step else "",
                        failed_step=failed_step.get("action", "") if failed_step else "",
                        error_details=failed_step.get("error_details", "") if failed_step else "",
                        console_errors=tc_result.get("console_errors", []),
                    )
                    screenshot_url = (
                        failed_step.get("screenshot_url") if failed_step else None
                    )
                    fs.create_bug_report(owner_id, {
                        "project_id": run["project_id"],
                        "run_id": run_id,
                        "test_case_id": tc_result["test_case_id"],
                        "title": f"[FAIL] {tc_result['title']}",
                        "severity": ai.get("severity", "medium"),
                        "classification": ai.get("classification", "inconclusive"),
                        "objective": tc_result.get("objective", ""),
                        "expected_behavior": tc_result.get("expected_result", ""),
                        "actual_behavior": failed_step.get("actual_observation", "") if failed_step else "",
                        "failed_step": failed_step.get("action", "") if failed_step else "",
                        "screenshot_url": screenshot_url,
                        "console_errors": tc_result.get("console_errors", []),
                        "possible_cause": ai.get("possible_cause"),
                        "suggested_steps": ai.get("suggested_steps", []),
                        "confidence": ai.get("confidence"),
                        "ai_analysis": ai,
                    })

            summary = result["summary"]
            total = len(result["test_case_results"])
            all_passed = summary["passed"] == total and total > 0

            fs.update_run(run_id, {
                "status": RunStatus.completed.value,
                "completed_at": datetime.now(timezone.utc),
                "summary": summary,
            })
            await emit({"message": "Run completed.", "status": "completed", "summary": summary})

    except Exception as exc:
        logger.error("Run %s failed: %s", run_id, exc, exc_info=True)
        fs.update_run(run_id, {
            "status": RunStatus.failed.value,
            "completed_at": datetime.now(timezone.utc),
            "error": str(exc),
        })
    finally:
        _running_locks.pop(run_id, None)


# ── SSE stream ────────────────────────────────────────────────────────────────

@router.get("/{run_id}/stream")
async def stream_run_events(
    run_id: str,
    request: Request,
    user: AuthenticatedUser = Depends(get_current_user),
):
    """Stream run events via Server-Sent Events."""
    run = fs.get_run(run_id, user.uid)
    if not run:
        raise HTTPException(status_code=404, detail="Test run not found.")

    async def event_generator():
        seen_ids = set()
        db = None
        try:
            from firebase_admin import firestore as fb_fs
            db = fb_fs.client()
        except Exception:
            yield f"data: {json.dumps({'message': 'Firestore unavailable', 'status': 'error'})}\n\n"
            return

        for _ in range(300):  # max 5 minutes at 1s poll
            if await request.is_disconnected():
                break

            run_doc = fs.get_run(run_id, user.uid)
            if not run_doc:
                break

            events = db.collection("testRuns").document(run_id).collection("events").order_by("timestamp").stream()
            for ev in events:
                ev_id = ev.id
                if ev_id not in seen_ids:
                    seen_ids.add(ev_id)
                    data = ev.to_dict()
                    ts = data.get("timestamp")
                    if hasattr(ts, "isoformat"):
                        data["timestamp"] = ts.isoformat()
                    yield f"data: {json.dumps(data)}\n\n"

            current_status = run_doc.get("status")
            if current_status in (RunStatus.completed.value, RunStatus.failed.value, RunStatus.cancelled.value):
                yield f"data: {json.dumps({'message': f'Run {current_status}', 'status': current_status, 'final': True})}\n\n"
                break

            await asyncio.sleep(1)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ── Cancel run ────────────────────────────────────────────────────────────────

@router.post("/{run_id}/cancel")
async def cancel_run(
    run_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
):
    run = fs.get_run(run_id, user.uid)
    if not run:
        raise HTTPException(status_code=404, detail="Test run not found.")
    if run["status"] not in (RunStatus.running.value, RunStatus.pending.value):
        raise HTTPException(status_code=409, detail="Run is not in a cancellable state.")
    fs.update_run(run_id, {"status": RunStatus.cancelled.value})
    return {"run_id": run_id, "status": RunStatus.cancelled.value}


# ── List & Get runs ────────────────────────────────────────────────────────────

@router.get("", response_model=List[dict])
async def list_runs(
    project_id: Optional[str] = None,
    user: AuthenticatedUser = Depends(get_current_user),
):
    runs = fs.list_runs(user.uid, project_id=project_id)
    return [_serialize(r) for r in runs]


@router.get("/{run_id}", response_model=dict)
async def get_run(
    run_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
):
    run = fs.get_run(run_id, user.uid)
    if not run:
        raise HTTPException(status_code=404, detail="Test run not found.")

    result = _serialize(run)
    result["test_case_results"] = fs.get_test_case_results(run_id)
    return result
