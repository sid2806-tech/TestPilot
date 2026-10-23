"""
Unit test runner using Python standard library's unittest module.
Does not require external dependencies like pytest.
"""
import unittest
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.url_security import validate_target_url, URLValidationError
from app.services.gemini_service import ALLOWED_ACTIONS
from app.schemas.test_run import TestPlan, TestCase, TestStep


class TestUrlSecurity(unittest.TestCase):
    def test_blocks_private_ip(self):
        with self.assertRaises(URLValidationError):
            validate_target_url("http://192.168.1.1/admin", [])

    def test_blocks_localhost(self):
        with self.assertRaises(URLValidationError):
            validate_target_url("http://127.0.0.1/", [])

    def test_blocks_metadata_endpoint(self):
        with self.assertRaises(URLValidationError):
            validate_target_url("http://169.254.169.254/latest/meta-data", [])

    def test_blocks_gcp_metadata(self):
        with self.assertRaises(URLValidationError):
            validate_target_url("http://metadata.google.internal/", [])

    def test_blocks_non_approved_domain(self):
        with self.assertRaises(URLValidationError):
            validate_target_url("https://evil.com/attack", ["example.com"])

    def test_blocks_empty_url(self):
        with self.assertRaises((URLValidationError, ValueError, Exception)):
            validate_target_url("", [])

    def test_blocks_ftp_scheme(self):
        with self.assertRaises(URLValidationError):
            validate_target_url("ftp://example.com/", [])

    def test_blocks_10_x_range(self):
        with self.assertRaises(URLValidationError):
            validate_target_url("http://10.0.0.1/", [])

    def test_blocks_172_range(self):
        with self.assertRaises(URLValidationError):
            validate_target_url("http://172.16.0.1/", [])


class TestGeminiActionAllowlist(unittest.TestCase):
    def test_allowed_actions_contain_required(self):
        required = {"navigate", "click", "fill", "assert_text", "assert_visible", "screenshot"}
        self.assertTrue(required.issubset(ALLOWED_ACTIONS))

    def test_allowed_actions_do_not_include_dangerous_commands(self):
        dangerous = {"execute", "eval", "exec", "subprocess", "import", "os"}
        self.assertFalse(dangerous.intersection(ALLOWED_ACTIONS))


class TestSchemaValidation(unittest.TestCase):
    def test_valid_test_plan(self):
        data = {
            "test_cases": [
                {
                    "id": "TC-001",
                    "title": "Verify Login Flow",
                    "objective": "Confirm valid credentials sign in",
                    "priority": "High",
                    "preconditions": ["User exists in demo db"],
                    "steps": [
                        {
                            "action": "navigate",
                            "target": "http://localhost:3001",
                            "value": None,
                            "description": "Navigate to demo login page",
                        },
                        {
                            "action": "fill",
                            "target": "#loginEmail",
                            "value": "demo@testpilot.ai",
                            "description": "Fill login email",
                        },
                        {
                            "action": "fill",
                            "target": "#loginPassword",
                            "value": "Demo1234!",
                            "description": "Fill login password",
                        },
                        {
                            "action": "click",
                            "target": "#loginBtn",
                            "value": None,
                            "description": "Click sign-in button",
                        },
                    ],
                    "expected_result": "User lands on dashboard with welcome banner",
                    "required_setup": [],
                }
            ]
        }
        plan = TestPlan.model_validate(data)
        self.assertEqual(len(plan.test_cases), 1)
        self.assertEqual(plan.test_cases[0].id, "TC-001")
        self.assertEqual(len(plan.test_cases[0].steps), 4)

    def test_invalid_test_plan_missing_fields(self):
        with self.assertRaises(Exception):
            TestPlan.model_validate({"test_cases": [{"id": "TC-FAIL"}]})


if __name__ == "__main__":
    unittest.main()
