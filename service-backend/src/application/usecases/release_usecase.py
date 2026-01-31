from uuid import UUID
from sqlalchemy.orm import Session
from src.infrastructure.repositories.release_repository import ReleaseRepository
from src.infrastructure.repositories.release_event_repository import ReleaseEventRepository
from src.infrastructure.repositories.approval_repository import ApprovalRepository
from src.infrastructure.repositories.audit_log_repository import AuditLogRepository
from src.infrastructure.repositories.application_repository import ApplicationRepository
from src.application.dtos.release_dtos import ReleaseRequest, ReleaseResponse


class ReleaseUseCase:
    def __init__(self, session: Session, actor_email: str = "system"):
        self.repo = ReleaseRepository(session)
        self.event_repo = ReleaseEventRepository(session)
        self.approval_repo = ApprovalRepository(session)
        self.audit_repo = AuditLogRepository(session)
        self.app_repo = ApplicationRepository(session)
        self.session = session
        self.actor_email = actor_email

    def create(self, request: ReleaseRequest) -> ReleaseResponse:
        app_id = UUID(request.application_id)
        
        existing = self.repo.get_by_app_version_env(app_id, request.version, request.environment)
        if existing:
            raise ValueError(f"Release {request.version} for env {request.environment} already exists")
        
        # Carregar nome da aplicação
        application = self.app_repo.get_by_id(app_id)
        app_name = application.name if application else "Unknown"
        
        release = self.repo.create(
            application_id=app_id,
            version=request.version,
            env=request.environment,
            evidence_url=request.evidence_url,
            evidence_score=request.evidence_score or 0
        )
        
        self.event_repo.create(
            release_id=release.id,
            event_type='CREATED',
            status='PENDING',
            notes=f"Release v{request.version} criado para {request.environment}"
        )
        
        # Log de auditoria
        self.audit_repo.create(
            actor=self.actor_email,
            action="CREATE",
            entity="RELEASE",
            entity_id=release.id,
            payload={
                "version": request.version,
                "environment": request.environment,
                "application_id": str(app_id),
                "application_name": app_name,
                "evidence_score": request.evidence_score or 0
            }
        )
        
        self.session.commit()
        return ReleaseResponse.from_orm(release)

    def get_by_id(self, release_id: UUID) -> ReleaseResponse:
        release = self.repo.get_by_id(release_id)
        if not release:
            raise ValueError(f"Release {release_id} not found")
        return ReleaseResponse.from_orm(release)

    def list_by_application(self, app_id: UUID, skip: int = 0, limit: int = 100):
        releases = self.repo.list_by_application(app_id, skip, limit)
        return [ReleaseResponse.from_orm(r) for r in releases]

    def list_by_status(self, status: str, skip: int = 0, limit: int = 100):
        releases = self.repo.list_by_status(status, skip, limit)
        return [ReleaseResponse.from_orm(r) for r in releases]

    def list_all(self, skip: int = 0, limit: int = 100):
        releases = self.repo.list_all(skip, limit)
        return [ReleaseResponse.from_orm(r) for r in releases]

    def update_status(self, release_id: UUID, status: str) -> ReleaseResponse:
        release = self.repo.update_status(release_id, status)
        if not release:
            raise ValueError(f"Release {release_id} not found")
        self.session.commit()
        return ReleaseResponse.from_orm(release)

    def promote(self, release_id: UUID, target_env: str) -> ReleaseResponse:
        release = self.repo.get_by_id(release_id)
        if not release:
            raise ValueError(f"Release {release_id} not found")
        
        # Guardar o ambiente original ANTES de atualizar
        from_env = release.env
        
        # Carregar informações da aplicação
        application = self.app_repo.get_by_id(release.application_id)
        app_name = application.name if application else "Unknown"
        
        # Verificar se já existe essa versão no ambiente alvo
        existing = self.repo.get_by_app_version_env(release.application_id, release.version, target_env)
        if existing:
            raise ValueError(f"Release {release.version} already exists in {target_env}")
        
        # Atualizar ambiente da release existente
        promoted = self.repo.update_environment(release_id, target_env)
        
        # Criar evento de promoção
        self.event_repo.create(
            release_id=release_id,
            event_type='PROMOTED',
            status='PENDING',
            notes=f"Release v{release.version} promovido para {target_env}"
        )
        
        # Log de auditoria (usando from_env capturado antes da atualização)
        self.audit_repo.create(
            actor=self.actor_email,
            action="PROMOTE",
            entity="RELEASE",
            entity_id=release_id,
            payload={
                "version": release.version,
                "environment": target_env,
                "from_env": from_env,
                "to_env": target_env,
                "application_id": str(release.application_id),
                "application_name": app_name
            }
        )
        
        self.session.commit()
        return ReleaseResponse.from_orm(promoted)

    def delete(self, release_id: UUID) -> bool:
        deleted = self.repo.delete(release_id)
        if not deleted:
            raise ValueError(f"Release {release_id} not found")
        self.session.commit()
        return True
