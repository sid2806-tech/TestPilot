"""
Pydantic schemas for Test Runs and related structures.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, field_validator


class TestCategory(str, Enum):
    authentication = "authentication"
    registration = "registration"
    form_validation = "form_validation"
    navigation = "navigation"
    functional = "functional"
    ui_smoke = "ui_smoke"
    regression = "regression"


class RunStatus(str, Enum):
    pending = "pending"
    generating = "generating"
    awaiting_approval = "awaiting_approval"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class StepStatus(str, Enum):
    passed = "passed"
    failed = "failed"
    blocked = "blocked"
    error = "error"
    skipped = "skipped"


# ── Test generation ───────────────────────────────────────────────────────────

class GenerateTestsRequest(BaseModel):
    project_id: str
    test_name: str
    target_url: str
    requirements: str
    category: TestCategory = TestCategory.functional
    timeout_seconds: int = 60

    @field_validator("requirements")
    @classmethod
    def requirements_not_empty(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 20:
            raise ValueError("Requirements must be at least 20 characters.")
        if len(v) > 5000:
            raise ValueError("Requirements must be 5000 characters or fewer.")
        return v

    @field_validator("timeout_seconds")
    @classmethod
    def clamp_timeout(cls, v: int) -> int:
        return max(10, min(v, 120))


class TestStep(BaseModel):
    action: str
    target: Optional[str] = None
    value: Optional[str] = None
    description: str


class TestCase(BaseModel):
    id: str
    title: str
    objective: str
    priority: str
    preconditions: List[str] = []
    steps: List[TestStep] = []
    expected_result: str
    required_setup: List[str] = []


class TestPlan(BaseModel):
    test_cases: List[TestCase]


# ── Test execution ─────────────────────────────────────────────────────────────

class ExecuteRunRequest(BaseModel):
    run_id: str


class StepResult(BaseModel):
    step_id: str
    action: str
    started_at: datetime
    duration_ms: int
    status: StepStatus
    expected_result: Optional[str] = None
    actual_observation: Optional[str] = None
    error_details: Optional[str] = None
    screenshot_url: Optional[str] = None


class TestCaseResult(BaseModel):
    test_case_id: str
    title: str
    status: StepStatus
    duration_ms: int
    step_results: List[StepResult] = []
    console_errors: List[str] = []


class RunSummary(BaseModel):
    run_id: str
    status: RunStatus
    total_cases: int
    passed: int
    failed: int
    blocked: int
    error: int
    skipped: int
    duration_ms: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class RunOut(BaseModel):
    id: str
    owner_id: str
    project_id: str
    test_name: str
    target_url: str
    category: str
    status: RunStatus
    test_plan: Optional[Dict[str, Any]] = None
    summary: Optional[Dict[str, Any]] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
