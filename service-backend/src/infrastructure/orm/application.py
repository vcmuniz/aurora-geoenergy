from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from src.infrastructure.database import Base

class ApplicationORM(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True, index=True)
    owner_team = Column(String(255))
    repo_url = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
