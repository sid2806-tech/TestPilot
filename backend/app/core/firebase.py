"""Firebase Admin SDK initialization."""

import json
import logging
import os

import firebase_admin
from firebase_admin import credentials

from app.core.config import settings

logger = logging.getLogger(__name__)
_initialized = False


def initialize_firebase() -> None:
    global _initialized
    if _initialized or firebase_admin._apps:
        return

    try:
        if settings.firebase_service_account_json:
            sa = json.loads(settings.firebase_service_account_json)
            cred = credentials.Certificate(sa)
        elif settings.firebase_service_account_path and os.path.exists(
            settings.firebase_service_account_path
        ):
            cred = credentials.Certificate(settings.firebase_service_account_path)
        else:
            # Use application default credentials (Cloud Run / GCE)
            cred = credentials.ApplicationDefault()

        firebase_admin.initialize_app(cred)
        _initialized = True
        logger.info("Firebase Admin SDK initialized.")
    except Exception as exc:
        logger.warning(
            "Firebase Admin SDK could not be initialized: %s. "
            "Authentication will be unavailable.",
            exc,
        )
