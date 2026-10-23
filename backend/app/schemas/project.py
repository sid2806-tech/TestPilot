"""
Pydantic schemas for Projects.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, field_validator, HttpUrl
import re


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    approved_domains: List[str] = []

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Project name cannot be empty.")
        if len(v) > 100:
            raise ValueError("Project name must be 100 characters or fewer.")
        return v

    @field_validator("approved_domains")
    @classmethod
    def validate_domains(cls, domains: List[str]) -> List[str]:
        validated = []
        domain_re = re.compile(
            r"^(?:[a-zA-Z0-9]"
            r"(?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+"
            r"[a-zA-Z]{2,}$"
        )
        for d in domains:
            d = d.strip().lower()
            if not domain_re.match(d):
                raise ValueError(f"'{d}' is not a valid domain name.")
            validated.append(d)
        return validated


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    approved_domains: Optional[List[str]] = None
    archived: Optional[bool] = None


class ProjectOut(BaseModel):
    id: str
    owner_id: str
    name: str
    description: str
    approved_domains: List[str]
    archived: bool
    created_at: datetime
    updated_at: datetime
