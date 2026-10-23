"""Pydantic schemas for bug reports."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class Severity(str, Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"
    info = "info"


class FailureClassification(str, Enum):
    confirmed_assertion_failure = "confirmed_assertion_failure"
    possible_application_defect = "possible_application_defect"
    test_configuration_error = "test_configuration_error"
    browser_environment_error = "browser_environment_error"
    inconclusive = "inconclusive"


class BugReportOut(BaseModel):
    id: str
    owner_id: str
    project_id: str
    run_id: str
    test_case_id: str
    title: str
    severity: Severity
    classification: FailureClassification
    objective: str
    expected_behavior: str
    actual_behavior: str
    failed_step: Optional[str] = None
    screenshot_url: Optional[str] = None
    console_errors: List[str] = []
    possible_cause: Optional[str] = None
    suggested_steps: List[str] = []
    confidence: Optional[str] = None
    ai_analysis: Optional[Dict[str, Any]] = None
    created_at: datetime
