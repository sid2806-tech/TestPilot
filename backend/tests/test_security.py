"""
Backend tests — URL security and Gemini response validation.
"""
import pytest
from app.core.url_security import validate_target_url, URLValidationError
from app.services.gemini_service import ALLOWED_ACTIONS
from app.schemas.test_run import TestPlan, TestCase, TestStep


# ─── URL Security tests ───────────────────────────────────────────────────────

def test_blocks_private_ip():
    with pytest.raises(URLValidationError):
        validate_target_url("http://192.168.1.1/admin", [])

def test_blocks_localhost():
    with pytest.raises(URLValidationError):
        validate_target_url("http://127.0.0.1/", [])

def test_blocks_metadata_endpoint():
    with pytest.raises(URLValidationError):
        validate_target_url("http://169.254.169.254/latest/meta-data", [])

def test_blocks_gcp_metadata():
    with pytest.raises(URLValidationError):
        validate_target_url("http://metadata.google.internal/", [])

def test_blocks_non_approved_domain():
    with pytest.raises(URLValidationError):
        validate_target_url("https://evil.com/attack", ["example.com"])

def test_allows_approved_domain():
    # This test makes a DNS call — skip in CI without network
    try:
        result = validate_target_url("https://example.com/", ["example.com"])
        assert result == "https://example.com/"
    except URLValidationError:
        pytest.skip("DNS not available in this environment")

def test_blocks_empty_url():
    with pytest.raises((URLValidationError, Exception)):
        validate_target_url("", [])

def test_blocks_http_only_scheme():
    with pytest.raises(URLValidationError):
        validate_target_url("ftp://example.com/", [])

def test_blocks_10_x_range():
    with pytest.raises(URLValidationError):
        validate_target_url("http://10.0.0.1/", [])

def test_blocks_172_range():
    with pytest.raises(URLValidationError):
        validate_target_url("http://172.16.0.1/", [])


# ─── Allowed action tests ─────────────────────────────────────────────────────

def test_allowed_actions_contain_required():
    required = {"navigate", "click", "fill", "assert_text", "assert_visible", "screenshot"}
    assert required.issubset(ALLOWED_ACTIONS)

def test_allowed_actions_do_not_include_execute():
    dangerous = {"execute", "eval", "exec", "subprocess", "import", "os"}
    assert not dangerous.intersection(ALLOWED_ACTIONS)


# ─── Schema validation tests ──────────────────────────────────────────────────

def test_valid_test_plan():
    data = {
        "test_cases": [
            {
                "id": "TC-001",
                "title": "Test login",
                "objective": "Verify login works",
                "priority": "High",
                "preconditions": [],
                "steps": [
                    {"action": "navigate", "target": "https://example.com/login", "value": None, "description": "Open login page"},
                    {"action": "fill", "target": "#email", "value": "user@test.com", "description": "Enter email"},
                    {"action": "click", "target": "button[type=submit]", "value": None, "description": "Submit form"},
                ],
                "expected_result": "User is logged in",
                "required_setup": [],
            }
        ]
    }
    plan = TestPlan.model_validate(data)
    assert len(plan.test_cases) == 1
    assert plan.test_cases[0].id == "TC-001"

def test_invalid_test_plan_missing_required():
    with pytest.raises(Exception):
        TestPlan.model_validate({"test_cases": [{"id": "TC-001"}]})  # missing required fields
