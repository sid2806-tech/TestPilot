"""Analytics endpoint."""
from fastapi import APIRouter, Depends
from app.core.auth import get_current_user, AuthenticatedUser
from app.services import firestore_service as fs

router = APIRouter()


@router.get("")
async def get_analytics(user: AuthenticatedUser = Depends(get_current_user)):
    return fs.get_analytics(user.uid)
