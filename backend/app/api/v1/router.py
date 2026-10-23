"""Main API v1 router."""
from fastapi import APIRouter

from app.api.v1.endpoints import projects, test_runs, bugs, analytics, reports, demo

api_router = APIRouter()
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(test_runs.router, prefix="/runs", tags=["Test Runs"])
api_router.include_router(bugs.router, prefix="/bugs", tags=["Bug Reports"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(demo.router, prefix="/demo", tags=["Demo"])
