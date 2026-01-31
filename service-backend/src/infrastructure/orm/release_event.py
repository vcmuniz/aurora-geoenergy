from sqlalchemy import Column, String, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from src.infrastructure.database import Base


class ReleaseEventORM(Base):
    __tablename__ = 'release_events'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    release_id = Column(UUID(as_uuid=True), ForeignKey('releases.id'), nullable=False)
    event_type = Column(String(50), nullable=False)  # CREATED, APPROVED, REJECTED, DEPLOYED, etc
    status = Column(String(50), nullable=False)  # PENDING, APPROVED, REJECTED, DEPLOYED, PROMOTED
    actor_email = Column(String(255))  # Quem fez a ação
    notes = Column(Text)  # Notas/comentários
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    def __repr__(self):
        return f"<ReleaseEventORM {self.id} - {self.event_type}>"
