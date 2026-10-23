"""
Firestore service — thin wrapper around the Admin SDK.
All Firestore access goes through this module.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from firebase_admin import firestore
from google.cloud.firestore_v1 import FieldFilter

logger = logging.getLogger(__name__)


def _db():
    return firestore.client()


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ─── Projects ─────────────────────────────────────────────────────────────────

def create_project(owner_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    db = _db()
    ref = db.collection("projects").document()
    doc = {
        "id": ref.id,
        "owner_id": owner_id,
        "name": data["name"],
        "description": data.get("description", ""),
        "approved_domains": data.get("approved_domains", []),
        "archived": False,
        "created_at": _now(),
        "updated_at": _now(),
    }
    ref.set(doc)
    return doc


def get_project(project_id: str, owner_id: str) -> Optional[Dict[str, Any]]:
    db = _db()
    doc = db.collection("projects").document(project_id).get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    if data.get("owner_id") != owner_id:
        return None   # ownership check
    return data


def list_projects(owner_id: str) -> List[Dict[str, Any]]:
    db = _db()
    docs = (
        db.collection("projects")
        .where(filter=FieldFilter("owner_id", "==", owner_id))
        .order_by("created_at", direction="DESCENDING")
        .stream()
    )
    return [d.to_dict() for d in docs]


def update_project(project_id: str, owner_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    db = _db()
    ref = db.collection("projects").document(project_id)
    doc = ref.get()
    if not doc.exists or doc.to_dict().get("owner_id") != owner_id:
        return None
    updates["updated_at"] = _now()
    ref.update(updates)
    return ref.get().to_dict()


# ─── Test Runs ────────────────────────────────────────────────────────────────

def create_run(owner_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    db = _db()
    ref = db.collection("testRuns").document()
    doc = {
        "id": ref.id,
        "owner_id": owner_id,
        **data,
        "created_at": _now(),
    }
    ref.set(doc)
    return doc


def get_run(run_id: str, owner_id: str) -> Optional[Dict[str, Any]]:
    db = _db()
    doc = db.collection("testRuns").document(run_id).get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    if data.get("owner_id") != owner_id:
        return None
    return data


def update_run(run_id: str, updates: Dict[str, Any]) -> None:
    db = _db()
    db.collection("testRuns").document(run_id).update(updates)


def list_runs(owner_id: str, project_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    db = _db()
    q = db.collection("testRuns").where(filter=FieldFilter("owner_id", "==", owner_id))
    if project_id:
        q = q.where(filter=FieldFilter("project_id", "==", project_id))
    docs = q.order_by("created_at", direction="DESCENDING").limit(limit).stream()
    return [d.to_dict() for d in docs]


def add_run_event(run_id: str, event: Dict[str, Any]) -> None:
    db = _db()
    db.collection("testRuns").document(run_id).collection("events").add(
        {**event, "timestamp": _now()}
    )


def save_test_case_result(run_id: str, result: Dict[str, Any]) -> None:
    db = _db()
    ref = db.collection("testRuns").document(run_id).collection("testCases").document(result["test_case_id"])
    ref.set(result)


def get_test_case_results(run_id: str) -> List[Dict[str, Any]]:
    db = _db()
    docs = db.collection("testRuns").document(run_id).collection("testCases").stream()
    return [d.to_dict() for d in docs]


# ─── Bug Reports ─────────────────────────────────────────────────────────────

def create_bug_report(owner_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    db = _db()
    ref = db.collection("bugReports").document()
    doc = {"id": ref.id, "owner_id": owner_id, **data, "created_at": _now()}
    ref.set(doc)
    return doc


def list_bug_reports(owner_id: str, project_id: Optional[str] = None) -> List[Dict[str, Any]]:
    db = _db()
    q = db.collection("bugReports").where(filter=FieldFilter("owner_id", "==", owner_id))
    if project_id:
        q = q.where(filter=FieldFilter("project_id", "==", project_id))
    docs = q.order_by("created_at", direction="DESCENDING").stream()
    return [d.to_dict() for d in docs]


def get_bug_report(bug_id: str, owner_id: str) -> Optional[Dict[str, Any]]:
    db = _db()
    doc = db.collection("bugReports").document(bug_id).get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    if data.get("owner_id") != owner_id:
        return None
    return data


# ─── Analytics ───────────────────────────────────────────────────────────────

def get_analytics(owner_id: str) -> Dict[str, Any]:
    db = _db()
    runs = (
        db.collection("testRuns")
        .where(filter=FieldFilter("owner_id", "==", owner_id))
        .order_by("created_at", direction="DESCENDING")
        .limit(200)
        .stream()
    )
    run_list = [r.to_dict() for r in runs]

    total = len(run_list)
    statuses = {"passed": 0, "failed": 0, "blocked": 0, "error": 0}
    durations = []
    by_day: Dict[str, Dict[str, int]] = {}

    for r in run_list:
        summary = r.get("summary") or {}
        for k in statuses:
            statuses[k] += summary.get(k, 0)
        if r.get("duration_ms"):
            durations.append(r["duration_ms"])
        created = r.get("created_at")
        if created:
            day = created.strftime("%Y-%m-%d") if hasattr(created, "strftime") else str(created)[:10]
            if day not in by_day:
                by_day[day] = {"passed": 0, "failed": 0, "total": 0}
            by_day[day]["total"] += 1
            by_day[day]["passed"] += summary.get("passed", 0)
            by_day[day]["failed"] += summary.get("failed", 0)

    avg_duration = int(sum(durations) / len(durations)) if durations else 0

    return {
        "total_runs": total,
        "statuses": statuses,
        "avg_duration_ms": avg_duration,
        "trend": [{"date": d, **v} for d, v in sorted(by_day.items())[-30:]],
    }
