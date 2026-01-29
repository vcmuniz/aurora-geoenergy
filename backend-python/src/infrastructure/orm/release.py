from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from src.infrastructure.database import Base

class ReleaseORM(Base):
    __tablename__ = "releases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(String(100), nullable=False)
    env = Column(String(50), nullable=False, index=True, default="DEV")
    status = Column(String(50), nullable=False, default="PENDING")
    evidence_url = Column(String(500))
    evidence_score = Column(Integer, default=0)
    version_row = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    deployed_at = Column(DateTime)

    __table_args__ = (
        UniqueConstraint("application_id", "version", "env", name="uq_app_version_env"),
        CheckConstraint("env IN ('DEV', 'PRE_PROD', 'PROD')", name="ck_release_env"),
        CheckConstraint("status IN ('PENDING', 'APPROVED', 'DEPLOYED', 'REJECTED')", name="ck_release_status"),
        CheckConstraint("evidence_score >= 0 AND evidence_score <= 100", name="ck_release_score"),
    )
