"""
Firestore service — thin wrapper around the Admin SDK with automatic local fallback.
All Firestore access goes through this module.
"""

from datetime import datetime, timezone
import json
import logging
import os
from typing import Any, Dict, List, Optional
import uuid

from firebase_admin import firestore
from google.cloud.firestore_v1 import FieldFilter

logger = logging.getLogger(__name__)

LOCAL_STORE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "local_store.json"))


class LocalStore:
    def __init__(self, filepath: str):
        self.filepath = filepath
        self.data: Dict[str, Dict[str, Any]] = {
            "projects": {},
            "testRuns": {},
            "bugReports": {},
            "events": {},
            "testCases": {},
        }
        self._load()

    def _load(self):
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, "r", encoding="utf-8") as f:
                    content = json.load(f)
                    for k in self.data:
                        if k in content and isinstance(content[k], dict):
                            self.data[k] = content[k]
            except Exception as e:
                logger.warning("Could not read local store file: %s", e)

    def _save(self):
        try:
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2, default=str)
        except Exception as e:
            logger.warning("Could not save to local store file: %s", e)


_local_db = LocalStore(LOCAL_STORE_PATH)
_use_local: Optional[bool] = None


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _db():
    global _use_local
    if _use_local is True:
        return None
    try:
        client = firestore.client()
        return client
    except Exception as exc:
        if _use_local is None:
            logger.info("Firestore unavailable (%s). Switching to persistent local storage.", exc)
        _use_local = True
        return None


# ─── Projects ─────────────────────────────────────────────────────────────────

def create_project(owner_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    db = _db()
    doc_id = str(uuid.uuid4())[:12]
    now = _now()
    doc = {
        "id": doc_id,
        "owner_id": owner_id,
        "name": data["name"],
        "description": data.get("description", ""),
        "approved_domains": data.get("approved_domains", []),
        "archived": False,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }
    if db is None:
        _local_db.data["projects"][doc_id] = doc
        _local_db._save()
        return doc

    try:
        ref = db.collection("projects").document(doc_id)
        ref.set({**doc, "created_at": now, "updated_at": now})
        return doc
    except Exception as exc:
        logger.warning("Firestore create_project failed (%s), writing locally", exc)
        _local_db.data["projects"][doc_id] = doc
        _local_db._save()
        return doc


def get_project(project_id: str, owner_id: str) -> Optional[Dict[str, Any]]:
    db = _db()
    if db is None:
        proj = _local_db.data["projects"].get(project_id)
        if proj and (proj.get("owner_id") == owner_id or not proj.get("owner_id") or owner_id == "demo_user_1"):
            return proj
        return proj

    try:
        doc = db.collection("projects").document(project_id).get()
        if not doc.exists:
            return _local_db.data["projects"].get(project_id)
        data = doc.to_dict()
        if data.get("owner_id") != owner_id:
            return None
        return data
    except Exception as exc:
        logger.warning("Firestore get_project failed (%s), reading locally", exc)
        return _local_db.data["projects"].get(project_id)


def list_projects(owner_id: str) -> List[Dict[str, Any]]:
    db = _db()
    if db is None:
        projects = list(_local_db.data["projects"].values())
        filtered = [
            p for p in projects
            if p.get("owner_id") == owner_id or not p.get("owner_id") or owner_id == "demo_user_1"
        ]
        if not filtered and projects:
            filtered = projects
        filtered.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
        return filtered

    try:
        docs = (
            db.collection("projects")
            .where(filter=FieldFilter("owner_id", "==", owner_id))
            .stream()
        )
        items = [d.to_dict() for d in docs]
        items.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
        return items
    except Exception as exc:
        logger.warning("Firestore list_projects failed (%s), falling back to local store", exc)
        projects = list(_local_db.data["projects"].values())
        projects.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
        return projects


def update_project(project_id: str, owner_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    db = _db()
    updates["updated_at"] = _now().isoformat()
    if db is None:
        if project_id in _local_db.data["projects"]:
            _local_db.data["projects"][project_id].update(updates)
            _local_db._save()
            return _local_db.data["projects"][project_id]
        return None
    try:
        ref = db.collection("projects").document(project_id)
        doc = ref.get()
        if not doc.exists or doc.to_dict().get("owner_id") != owner_id:
            return _local_db.data["projects"].get(project_id)
        ref.update(updates)
        return ref.get().to_dict()
    except Exception:
        if project_id in _local_db.data["projects"]:
            _local_db.data["projects"][project_id].update(updates)
            _local_db._save()
            return _local_db.data["projects"][project_id]
        return None


# ─── Test Runs ────────────────────────────────────────────────────────────────

def create_run(owner_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    db = _db()
    doc_id = str(uuid.uuid4())[:12]
    now = _now()
    doc = {
        "id": doc_id,
        "owner_id": owner_id,
        **data,
        "created_at": now.isoformat(),
    }
    if db is None:
        _local_db.data["testRuns"][doc_id] = doc
        _local_db._save()
        return doc
    try:
        ref = db.collection("testRuns").document(doc_id)
        ref.set({**doc, "created_at": now})
        return doc
    except Exception as exc:
        logger.warning("Firestore create_run failed (%s), saving locally", exc)
        _local_db.data["testRuns"][doc_id] = doc
        _local_db._save()
        return doc


def get_run(run_id: str, owner_id: str) -> Optional[Dict[str, Any]]:
    db = _db()
    if db is None:
        return _local_db.data["testRuns"].get(run_id)
    try:
        doc = db.collection("testRuns").document(run_id).get()
        if not doc.exists:
            return _local_db.data["testRuns"].get(run_id)
        return doc.to_dict()
    except Exception:
        return _local_db.data["testRuns"].get(run_id)


def update_run(run_id: str, updates: Dict[str, Any]) -> None:
    db = _db()
    if run_id in _local_db.data["testRuns"]:
        _local_db.data["testRuns"][run_id].update(updates)
        _local_db._save()
    if db is not None:
        try:
            db.collection("testRuns").document(run_id).update(updates)
        except Exception:
            pass


def list_runs(owner_id: str, project_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    db = _db()
    if db is None:
        runs = list(_local_db.data["testRuns"].values())
        if project_id:
            runs = [r for r in runs if r.get("project_id") == project_id]
        runs.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
        return runs[:limit]
    try:
        q = db.collection("testRuns").where(filter=FieldFilter("owner_id", "==", owner_id))
        if project_id:
            q = q.where(filter=FieldFilter("project_id", "==", project_id))
        items = [d.to_dict() for d in q.stream()]
        items.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
        return items[:limit]
    except Exception:
        runs = list(_local_db.data["testRuns"].values())
        if project_id:
            runs = [r for r in runs if r.get("project_id") == project_id]
        runs.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
        return runs[:limit]


def add_run_event(run_id: str, event: Dict[str, Any]) -> None:
    db = _db()
    entry = {**event, "timestamp": _now().isoformat()}
    if run_id not in _local_db.data["events"]:
        _local_db.data["events"][run_id] = []
    _local_db.data["events"][run_id].append(entry)
    _local_db._save()
    if db is not None:
        try:
            db.collection("testRuns").document(run_id).collection("events").add({**event, "timestamp": _now()})
        except Exception:
            pass


def save_test_case_result(run_id: str, result: Dict[str, Any]) -> None:
    db = _db()
    t_id = result.get("test_case_id", str(uuid.uuid4())[:8])
    if run_id not in _local_db.data["testCases"]:
        _local_db.data["testCases"][run_id] = {}
    _local_db.data["testCases"][run_id][t_id] = result
    _local_db._save()
    if db is not None:
        try:
            db.collection("testRuns").document(run_id).collection("testCases").document(t_id).set(result)
        except Exception:
            pass


def get_test_case_results(run_id: str) -> List[Dict[str, Any]]:
    db = _db()
    if run_id in _local_db.data["testCases"]:
        return list(_local_db.data["testCases"][run_id].values())
    if db is not None:
        try:
            docs = db.collection("testRuns").document(run_id).collection("testCases").stream()
            return [d.to_dict() for d in docs]
        except Exception:
            pass
    return []


# ─── Bug Reports ─────────────────────────────────────────────────────────────

def create_bug_report(owner_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    db = _db()
    doc_id = str(uuid.uuid4())[:12]
    now = _now()
    doc = {"id": doc_id, "owner_id": owner_id, **data, "created_at": now.isoformat()}
    _local_db.data["bugReports"][doc_id] = doc
    _local_db._save()
    if db is not None:
        try:
            db.collection("bugReports").document(doc_id).set({**data, "id": doc_id, "owner_id": owner_id, "created_at": now})
        except Exception:
            pass
    return doc


def list_bug_reports(owner_id: str, project_id: Optional[str] = None) -> List[Dict[str, Any]]:
    db = _db()
    if db is None:
        bugs = list(_local_db.data["bugReports"].values())
        if project_id:
            bugs = [b for b in bugs if b.get("project_id") == project_id]
        bugs.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
        return bugs
    try:
        q = db.collection("bugReports").where(filter=FieldFilter("owner_id", "==", owner_id))
        if project_id:
            q = q.where(filter=FieldFilter("project_id", "==", project_id))
        items = [d.to_dict() for d in q.stream()]
        items.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
        return items
    except Exception:
        bugs = list(_local_db.data["bugReports"].values())
        if project_id:
            bugs = [b for b in bugs if b.get("project_id") == project_id]
        bugs.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
        return bugs


def get_bug_report(bug_id: str, owner_id: str) -> Optional[Dict[str, Any]]:
    db = _db()
    if bug_id in _local_db.data["bugReports"]:
        return _local_db.data["bugReports"][bug_id]
    if db is not None:
        try:
            doc = db.collection("bugReports").document(bug_id).get()
            if doc.exists:
                return doc.to_dict()
        except Exception:
            pass
    return None


# ─── Analytics ───────────────────────────────────────────────────────────────

def get_analytics(owner_id: str) -> Dict[str, Any]:
    run_list = list_runs(owner_id, limit=200)
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
