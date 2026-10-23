"""
Application configuration — loaded from environment variables.
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ───────────────────────────────────────────────────────────────────
    debug: bool = False
    app_name: str = "TestPilot AI"
    app_version: str = "1.0.0"

    # ── CORS ──────────────────────────────────────────────────────────────────
    allowed_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    # ── Google Gemini ──────────────────────────────────────────────────────────
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"

    # ── Firebase ──────────────────────────────────────────────────────────────
    firebase_service_account_path: str = ""
    firebase_service_account_json: str = ""

    # ── Google Cloud ──────────────────────────────────────────────────────────
    gcs_bucket_name: str = ""
    google_cloud_project: str = ""

    # ── Execution limits ──────────────────────────────────────────────────────
    max_test_timeout_seconds: int = 120
    max_concurrent_runs: int = 3
    max_steps_per_run: int = 50

    # ── Demo ──────────────────────────────────────────────────────────────────
    demo_bug_enabled: bool = True


settings = Settings()
