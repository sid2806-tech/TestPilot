"""
Application configuration — loaded from environment variables.
"""

from typing import List, Union, Any
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ───────────────────────────────────────────────────────────────────
    debug: bool = False
    app_name: str = "TestPilot AI"
    app_version: str = "1.0.0"

    # ── CORS ──────────────────────────────────────────────────────────────────
    allowed_origins: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:5173", "http://localhost:3000"]


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
