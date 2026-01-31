from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ApprovalRequest(BaseModel):
    release_id: str
    outcome: str  # APPROVED, REJECTED
    notes: Optional[str] = None


class ApprovalResponse(BaseModel):
    id: str
    release_id: str
    approver_email: str
    outcome: str
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
