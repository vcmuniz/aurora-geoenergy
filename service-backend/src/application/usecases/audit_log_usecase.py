from uuid import UUID
from sqlalchemy.orm import Session
from src.infrastructure.repositories.audit_log_repository import AuditLogRepository
from src.application.dtos.audit_log_dtos import AuditLogResponse


class AuditLogUseCase:
    def __init__(self, session: Session):
        self.repo = AuditLogRepository(session)
        self.session = session

    def create_log(self, actor: str, action: str, entity: str, entity_id: UUID, 
                   payload: dict = None, request_id: str = None) -> AuditLogResponse:
        log = self.repo.create(actor, action, entity, entity_id, payload, request_id)
        self.session.commit()
        return AuditLogResponse.from_orm(log)

    def list_all(self, skip: int = 0, limit: int = 100):
        logs = self.repo.list_all(skip, limit)
        return [AuditLogResponse.from_orm(log) for log in logs]

    def list_by_entity(self, entity: str, entity_id: UUID, skip: int = 0, limit: int = 100):
        logs = self.repo.list_by_entity(entity, entity_id, skip, limit)
        return [AuditLogResponse.from_orm(log) for log in logs]

    def list_by_actor(self, actor: str, skip: int = 0, limit: int = 100):
        logs = self.repo.list_by_actor(actor, skip, limit)
        return [AuditLogResponse.from_orm(log) for log in logs]
