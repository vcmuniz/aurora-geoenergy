from sqlalchemy import Column, String, DateTime, ForeignKey, CheckConstraint, Text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from src.infrastructure.database import Base

class ApprovalORM(Base):
    __tablename__ = "approvals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    release_id = Column(UUID(as_uuid=True), ForeignKey("releases.id", ondelete="CASCADE"), nullable=False, index=True)
    approver_email = Column(String(255), nullable=False, index=True)
    outcome = Column(String(50), nullable=True)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = ()
