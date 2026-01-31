from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReleaseRequest(BaseModel):
    application_id: str
    version: str
    env: str  # DEV, PRE_PROD, PROD
    evidence_url: Optional[str] = None
    evidence_score: Optional[int] = 0


class ReleaseResponse(BaseModel):
    id: str
    application_id: str
    version: str
    env: str
    status: str  # PENDING, APPROVED, DEPLOYED, REJECTED
    evidence_url: Optional[str]
    evidence_score: int
    version_row: int
    created_at: datetime
    deployed_at: Optional[datetime]

    class Config:
        from_attributes = True
