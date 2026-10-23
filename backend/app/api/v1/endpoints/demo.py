"""Demo configuration endpoint — toggle intentional bug."""
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()
_bug_enabled = True  # runtime toggle (not persisted)


@router.get("/status")
async def demo_status():
    return {
        "demo_bug_enabled": _bug_enabled,
        "demo_url": "http://localhost:3001",
        "demo_accounts": [
            {"email": "demo@testpilot.ai", "password": "Demo1234!"},
        ],
    }


@router.post("/toggle-bug")
async def toggle_bug():
    global _bug_enabled
    _bug_enabled = not _bug_enabled
    return {"demo_bug_enabled": _bug_enabled}
