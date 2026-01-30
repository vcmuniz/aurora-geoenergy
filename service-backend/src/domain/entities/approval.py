from enum import Enum
from datetime import datetime
from typing import Optional

class ApprovalOutcome(str, Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Approval:
    def __init__(
        self,
        id: str,
        release_id: str,
        approver_email: str,
        outcome: ApprovalOutcome,
        notes: Optional[str] = None,
        created_at: Optional[datetime] = None
    ):
        self.id = id
        self.release_id = release_id
        self.approver_email = approver_email
        self.outcome = outcome
        self.notes = notes
        self.created_at = created_at or datetime.utcnow()

    def __repr__(self):
        return f"<Approval id={self.id} release_id={self.release_id} outcome={self.outcome.value}>"
