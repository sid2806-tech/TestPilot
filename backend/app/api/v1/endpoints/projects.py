"""Projects CRUD endpoints."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user, AuthenticatedUser
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut
from app.services import firestore_service as fs

router = APIRouter()


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate,
    user: AuthenticatedUser = Depends(get_current_user),
):
    doc = fs.create_project(user.uid, body.model_dump())
    return _serialize(doc)


@router.get("", response_model=List[dict])
async def list_projects(user: AuthenticatedUser = Depends(get_current_user)):
    docs = fs.list_projects(user.uid)
    return [_serialize(d) for d in docs]


@router.get("/{project_id}", response_model=dict)
async def get_project(
    project_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
):
    doc = fs.get_project(project_id, user.uid)
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found.")
    return _serialize(doc)


@router.patch("/{project_id}", response_model=dict)
async def update_project(
    project_id: str,
    body: ProjectUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    doc = fs.update_project(project_id, user.uid, updates)
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found.")
    return _serialize(doc)


def _serialize(doc: dict) -> dict:
    """Convert Firestore timestamps to ISO strings."""
    result = {}
    for k, v in doc.items():
        if hasattr(v, "isoformat"):
            result[k] = v.isoformat()
        else:
            result[k] = v
    return result
