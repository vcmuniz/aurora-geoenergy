from enum import Enum
from datetime import datetime
from typing import Optional


class ReleaseEnv(str, Enum):
    DEV = "DEV"
    PRE_PROD = "PRE_PROD"
    PROD = "PROD"


class ReleaseStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Release:
    def __init__(
        self,
        id: str,
        application_id: str,
        version: str,
        env: ReleaseEnv,
        status: ReleaseStatus = ReleaseStatus.PENDING,
        evidence_url: Optional[str] = None,
        evidence_score: int = 0,
        version_row: int = 0,
        created_at: Optional[datetime] = None,
        deployed_at: Optional[datetime] = None
    ):
        self.id = id
        self.application_id = application_id
        self.version = version
        self.env = env
        self.status = status
        self.evidence_url = evidence_url
        self.evidence_score = evidence_score
        self.version_row = version_row
        self.created_at = created_at or datetime.utcnow()
        self.deployed_at = deployed_at

    def __repr__(self):
        return f"<Release id={self.id} version={self.version} env={self.env.value} status={self.status.value}>"
