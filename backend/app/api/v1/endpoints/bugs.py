"""Bug reports endpoints."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_user, AuthenticatedUser
from app.services import firestore_service as fs
from app.services.gemini_service import group_failures

router = APIRouter()


def _serialize(doc: dict) -> dict:
    result = {}
    for k, v in doc.items():
        if hasattr(v, "isoformat"):
            result[k] = v.isoformat()
        else:
            result[k] = v
    return result


@router.get("", response_model=List[dict])
async def list_bugs(
    project_id: Optional[str] = None,
    user: AuthenticatedUser = Depends(get_current_user),
):
    bugs = fs.list_bug_reports(user.uid, project_id=project_id)
    return [_serialize(b) for b in bugs]


@router.get("/groups", response_model=dict)
async def get_failure_groups(
    project_id: Optional[str] = None,
    user: AuthenticatedUser = Depends(get_current_user),
):
    bugs = fs.list_bug_reports(user.uid, project_id=project_id)
    if not bugs:
        return {"groups": []}
    groups = group_failures(bugs)
    return {"groups": groups}


@router.get("/{bug_id}", response_model=dict)
async def get_bug(
    bug_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
):
    bug = fs.get_bug_report(bug_id, user.uid)
    if not bug:
        raise HTTPException(status_code=404, detail="Bug report not found.")
    return _serialize(bug)
