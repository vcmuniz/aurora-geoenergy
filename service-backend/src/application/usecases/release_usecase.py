from uuid import UUID
from sqlalchemy.orm import Session
from src.infrastructure.repositories.release_repository import ReleaseRepository
from src.infrastructure.repositories.release_event_repository import ReleaseEventRepository
from src.infrastructure.repositories.approval_repository import ApprovalRepository
from src.infrastructure.repositories.audit_log_repository import AuditLogRepository
from src.infrastructure.repositories.application_repository import ApplicationRepository
from src.application.dtos.release_dtos import ReleaseRequest, ReleaseResponse
from src.application.dtos.pagination_dto import PaginatedResponse
from src.domain.services.policy_service import get_policy_service
from src.domain.services.scoring_service import ScoringService


class ReleaseUseCase:
    def __init__(self, session: Session, actor_email: str = None):
        self.repo = ReleaseRepository(session)
        self.event_repo = ReleaseEventRepository(session)
        self.approval_repo = ApprovalRepository(session)
        self.audit_repo = AuditLogRepository(session)
        self.app_repo = ApplicationRepository(session)
        self.session = session
        self.actor_email = actor_email or "unknown"

    def create(self, request: ReleaseRequest) -> ReleaseResponse:
        app_id = UUID(request.application_id)
        
        existing = self.repo.get_by_app_version_env(app_id, request.version, request.environment)
        if existing:
            raise ValueError(f"Release {request.version} for env {request.environment} already exists")
        
        # Carregar nome da aplicação
        application = self.app_repo.get_by_id(app_id)
        app_name = application.name if application else "Unknown"
        
        # Calcular score automaticamente se evidence_url fornecida
        evidence_score = request.evidence_score or 0
        if request.evidence_url:
            evidence_score = ScoringService.calculate_score(request.evidence_url)
        
        release = self.repo.create(
            application_id=app_id,
            version=request.version,
            env=request.environment,
            evidence_url=request.evidence_url,
            evidence_score=evidence_score
        )
        
        self.event_repo.create(
            release_id=release.id,
            event_type='CREATED',
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

    def list_by_application(self, app_id: UUID, skip: int = 0, limit: int = 100) -> PaginatedResponse[ReleaseResponse]:
        releases = self.repo.list_by_application(app_id, skip, limit)
        total = self.repo.count_by_application(app_id)
        data = [ReleaseResponse.from_orm(r) for r in releases]
        return PaginatedResponse(data=data, total=total, skip=skip, limit=limit)

    def list_by_status(self, status: str, skip: int = 0, limit: int = 100) -> PaginatedResponse[ReleaseResponse]:
        releases = self.repo.list_by_status(status, skip, limit)
        total = self.repo.count_by_status(status)
        data = [ReleaseResponse.from_orm(r) for r in releases]
        return PaginatedResponse(data=data, total=total, skip=skip, limit=limit)

    def list_all(self, skip: int = 0, limit: int = 100) -> PaginatedResponse[ReleaseResponse]:
        releases = self.repo.list_all(skip, limit)
        total = self.repo.count_all()
        data = [ReleaseResponse.from_orm(r) for r in releases]
        return PaginatedResponse(data=data, total=total, skip=skip, limit=limit)

    def list_pending_for_user(self, approver_email: str, skip: int = 0, limit: int = 100) -> PaginatedResponse[ReleaseResponse]:
        """Retorna releases que o usuário ainda NÃO aprovou e NÃO rejeitou"""
        # Carregar todos os releases para contar
        all_releases = self.repo.list_all(0, 999999)  # Carregar tudo em memória para contar
        pending_releases = []
        
        for release in all_releases:
            approvals = self.approval_repo.list_by_release(release.id)
            user_approval = next(
                (a for a in approvals if a.approver_email == approver_email and a.outcome),
                None
            )
            
            if not user_approval:
                application = self.app_repo.get_by_id(release.application_id)
                app_name = application.name if application else "Unknown"
                pending_releases.append((release, app_name))
        
        # Aplicar paginação após filtro
        total = len(pending_releases)
        paginated = pending_releases[skip:skip + limit]
        data = [ReleaseResponse.from_orm(r, app_name) for r, app_name in paginated]
        return PaginatedResponse(data=data, total=total, skip=skip, limit=limit)

    def list_approved_by_user(self, approver_email: str, skip: int = 0, limit: int = 100) -> PaginatedResponse[ReleaseResponse]:
        """Retorna releases APROVADOS pelo usuário"""
        all_releases = self.repo.list_all(0, 999999)
        approved_releases = []
        
        for release in all_releases:
            approvals = self.approval_repo.list_by_release(release.id)
            user_approval = next(
                (a for a in approvals if a.approver_email == approver_email),
                None
            )
            
            if user_approval and user_approval.outcome == 'APPROVED':
                application = self.app_repo.get_by_id(release.application_id)
                app_name = application.name if application else "Unknown"
                approved_releases.append((release, app_name))
        
        total = len(approved_releases)
        paginated = approved_releases[skip:skip + limit]
        data = [ReleaseResponse.from_orm(r, app_name) for r, app_name in paginated]
        return PaginatedResponse(data=data, total=total, skip=skip, limit=limit)

    def list_rejected_by_user(self, approver_email: str, skip: int = 0, limit: int = 100) -> PaginatedResponse[ReleaseResponse]:
        """Retorna releases REJEITADOS pelo usuário"""
        all_releases = self.repo.list_all(0, 999999)
        rejected_releases = []
        
        for release in all_releases:
            approvals = self.approval_repo.list_by_release(release.id)
            user_approval = next(
                (a for a in approvals if a.approver_email == approver_email),
                None
            )
            
            if user_approval and user_approval.outcome == 'REJECTED':
                application = self.app_repo.get_by_id(release.application_id)
                app_name = application.name if application else "Unknown"
                rejected_releases.append((release, app_name))
        
        total = len(rejected_releases)
        paginated = rejected_releases[skip:skip + limit]
        data = [ReleaseResponse.from_orm(r, app_name) for r, app_name in paginated]
        return PaginatedResponse(data=data, total=total, skip=skip, limit=limit)

    def update_status(self, release_id: UUID, status: str) -> ReleaseResponse:
        release = self.repo.update_status(release_id, status)
        if not release:
            raise ValueError(f"Release {release_id} not found")
        self.session.commit()
        return ReleaseResponse.from_orm(release)

    def update(self, release_id: UUID, request: ReleaseRequest) -> ReleaseResponse:
        release = self.repo.get_by_id(release_id)
        if not release:
            raise ValueError(f"Release {release_id} not found")
        
        # OPTIMISTIC LOCKING: Validar versionRow se fornecido
        if request.version_row is not None and release.version_row != request.version_row:
            raise ValueError(f"Conflict: Release was modified (version {release.version_row} != {request.version_row})")
        
        # Carregar nome da aplicação
        application = self.app_repo.get_by_id(release.application_id)
        app_name = application.name if application else "Unknown"
        
        # Calcular score automaticamente se evidence_url fornecida
        evidence_score = request.evidence_score or 0
        if request.evidence_url:
            evidence_score = ScoringService.calculate_score(request.evidence_url)
        
        # Atualizar campos
        release.version = request.version
        release.env = request.environment
        release.evidence_url = request.evidence_url
        release.evidence_score = evidence_score
        release.version_row = (release.version_row or 0) + 1
        
        self.session.add(release)
        
        # Log de timeline
        self.event_repo.create(
            release_id=release.id,
            event_type='UPDATED',
            notes=f"Release v{request.version} atualizado para {request.environment} com score {evidence_score}"
        )
        
        # Log de auditoria
        self.audit_repo.create(
            actor=self.actor_email,
            action="UPDATE",
            entity="RELEASE",
            entity_id=release.id,
            payload={
                "version": request.version,
                "environment": request.environment,
                "application_id": str(release.application_id),
                "application_name": app_name,
                "evidence_url": request.evidence_url,
                "evidence_score": evidence_score
            }
        )
        
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
        
        # VALIDAR POLICY
        policy_service = get_policy_service()
        
        # Contar approvals
        approvals = self.approval_repo.list_by_release(release_id)
        approval_count = len([a for a in approvals if a.outcome == 'APPROVED'])
        
        # Validar promoção com policy
        is_valid, message = policy_service.validate_promotion(
            from_env=from_env,
            to_env=target_env,
            approval_count=approval_count,
            evidence_score=release.evidence_score,
            evidence_url=release.evidence_url
        )
        
        if not is_valid:
            raise ValueError(f"Promoção bloqueada: {message}")
        
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

    def reject_release(self, release_id: UUID, notes: str = None) -> ReleaseResponse:
        """Rejeitar uma release (muda status para REJECTED)"""
        release = self.repo.get_by_id(release_id)
        if not release:
            raise ValueError(f"Release {release_id} not found")
        
        if release.status == 'REJECTED':
            raise ValueError(f"Release já está rejeitada")
        
        # Carregar informações da aplicação
        application = self.app_repo.get_by_id(release.application_id)
        app_name = application.name if application else "Unknown"
        
        # Atualizar status para REJECTED
        self.repo.update_status(release_id, 'REJECTED')
        
        # Criar evento
        self.event_repo.create(
            release_id=release_id,
            event_type='REJECTED',
            status='REJECTED',
            actor_email=self.actor_email,
            notes=notes or "Release rejeitada"
        )
        
        # Log de auditoria
        self.audit_repo.create(
            actor=self.actor_email,
            action="REJECT_RELEASE",
            entity="RELEASE",
            entity_id=release_id,
            payload={
                "release_id": str(release_id),
                "version": release.version,
                "environment": release.env,
                "application_id": str(release.application_id),
                "application_name": app_name,
                "notes": notes
            }
        )
        
        self.session.commit()
        
        # Retornar release atualizada
        updated_release = self.repo.get_by_id(release_id)
        return ReleaseResponse.from_orm(updated_release)

    def deploy_release(self, release_id: UUID, notes: str = None) -> ReleaseResponse:
        """Marcar uma release como implantada (DEPLOYED)"""
        release = self.repo.get_by_id(release_id)
        if not release:
            raise ValueError(f"Release {release_id} not found")
        
        if release.env != 'PROD':
            raise ValueError(f"Apenas releases em PROD podem ser implantadas")
        
        if release.status == 'DEPLOYED':
            raise ValueError(f"Release já está implantada")
        
        if release.status != 'APPROVED':
            raise ValueError(f"Release precisa estar APPROVED para ser implantada")
        
        # Carregar informações da aplicação
        application = self.app_repo.get_by_id(release.application_id)
        app_name = application.name if application else "Unknown"
        
        # Atualizar status para DEPLOYED
        self.repo.update_status(release_id, 'DEPLOYED')
        
        # Criar evento
        self.event_repo.create(
            release_id=release_id,
            event_type='DEPLOYED',
            status='DEPLOYED',
            actor_email=self.actor_email,
            notes=notes or "Release implantada em produção"
        )
        
        # Log de auditoria
        self.audit_repo.create(
            actor=self.actor_email,
            action="DEPLOY",
            entity="RELEASE",
            entity_id=release_id,
            payload={
                "release_id": str(release_id),
                "version": release.version,
                "environment": release.env,
                "application_id": str(release.application_id),
                "application_name": app_name,
                "notes": notes
            }
        )
        
        self.session.commit()
        
        # Retornar release atualizada
        updated_release = self.repo.get_by_id(release_id)
        return ReleaseResponse.from_orm(updated_release)

    def delete(self, release_id: UUID) -> bool:
        deleted = self.repo.delete(release_id)
        if not deleted:
            raise ValueError(f"Release {release_id} not found")
        self.session.commit()
        return True
