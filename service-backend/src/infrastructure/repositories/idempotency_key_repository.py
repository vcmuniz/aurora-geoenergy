from sqlalchemy.orm import Session
from src.infrastructure.orm.idempotency_key import IdempotencyKey
from datetime import datetime
import json


class IdempotencyKeyRepository:
    def __init__(self, session: Session):
        self.session = session
    
    def get_by_key(self, key: str):
        """Recuperar idempotency key se existir e não expirada"""
        record = self.session.query(IdempotencyKey).filter(
            IdempotencyKey.key == key,
            IdempotencyKey.expires_at > datetime.utcnow()
        ).first()
        return record
    
    def create(self, key: str, request_method: str, request_path: str, response_body: dict, status_code: str):
        """Criar novo registro de idempotency"""
        record = IdempotencyKey(
            key=key,
            request_method=request_method,
            request_path=request_path,
            response_body=json.dumps(response_body),
            status_code=status_code,
            expires_at=IdempotencyKey.create_default_expiry()
        )
        self.session.add(record)
        self.session.commit()
        return record
    
    def cleanup_expired(self):
        """Remover registros expirados (manutenção)"""
        self.session.query(IdempotencyKey).filter(
            IdempotencyKey.expires_at <= datetime.utcnow()
        ).delete()
        self.session.commit()
