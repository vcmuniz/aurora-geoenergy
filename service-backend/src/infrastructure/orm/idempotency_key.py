from sqlalchemy import Column, String, DateTime, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timedelta
import uuid
from src.infrastructure.database import Base


class IdempotencyKey(Base):
    """Armazena requisições idempotentes para deduplicação"""
    __tablename__ = "idempotency_keys"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String(255), unique=True, nullable=False, index=True)
    request_method = Column(String(10), nullable=False)
    request_path = Column(String(500), nullable=False)
    response_body = Column(Text, nullable=False)  # JSON serializado
    status_code = Column(String(3), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    
    def __repr__(self):
        return f"<IdempotencyKey {self.key}>"
    
    @staticmethod
    def create_default_expiry():
        """Expiração padrão: 24 horas"""
        return datetime.utcnow() + timedelta(hours=24)
