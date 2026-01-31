from uuid import UUID
from sqlalchemy.orm import Session
from src.infrastructure.orm.audit_log import AuditLogORM


class AuditLogRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, actor: str, action: str, entity: str, entity_id: UUID, 
               payload: dict = None, request_id: str = None) -> AuditLogORM:
        log = AuditLogORM(
            actor=actor,
            action=action,
            entity=entity,
            entity_id=str(entity_id),
            payload=payload or {},
            request_id=request_id
        )
        self.session.add(log)
        self.session.flush()
        return log

    def list_by_entity(self, entity: str, entity_id: UUID, skip: int = 0, limit: int = 100):
        return self.session.query(AuditLogORM).filter(
            AuditLogORM.entity == entity,
            AuditLogORM.entity_id == str(entity_id)
        ).order_by(AuditLogORM.created_at.desc()).offset(skip).limit(limit).all()
    
    def count_by_entity(self, entity: str, entity_id: UUID) -> int:
        return self.session.query(AuditLogORM).filter(
            AuditLogORM.entity == entity,
            AuditLogORM.entity_id == str(entity_id)
        ).count()

    def list_by_actor(self, actor: str, skip: int = 0, limit: int = 100):
        return self.session.query(AuditLogORM).filter(
            AuditLogORM.actor == actor
        ).order_by(AuditLogORM.created_at.desc()).offset(skip).limit(limit).all()
    
    def count_by_actor(self, actor: str) -> int:
        return self.session.query(AuditLogORM).filter(
            AuditLogORM.actor == actor
        ).count()

    def list_all(self, skip: int = 0, limit: int = 100):
        return self.session.query(AuditLogORM).order_by(
            AuditLogORM.created_at.desc()
        ).offset(skip).limit(limit).all()
    
    def count_all(self) -> int:
        return self.session.query(AuditLogORM).count()
