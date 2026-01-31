from uuid import UUID
from sqlalchemy.orm import Session
from src.infrastructure.repositories.approval_repository import ApprovalRepository
from src.infrastructure.repositories.release_repository import ReleaseRepository
from src.infrastructure.repositories.release_event_repository import ReleaseEventRepository
from src.infrastructure.repositories.audit_log_repository import AuditLogRepository
from src.infrastructure.repositories.application_repository import ApplicationRepository
from src.application.dtos.approval_dtos import ApprovalRequest, ApprovalResponse


class ApprovalUseCase:
    def __init__(self, session: Session, actor_email: str = "system"):
        self.repo = ApprovalRepository(session)
        self.event_repo = ReleaseEventRepository(session)
        self.audit_repo = AuditLogRepository(session)
        self.release_repo = ReleaseRepository(session)
        self.app_repo = ApplicationRepository(session)
        self.session = session
        self.actor_email = actor_email

    def create(self, release_id: UUID, approver_email: str, request: ApprovalRequest) -> ApprovalResponse:
        approval = self.repo.create(
            release_id=release_id,
            approver_email=approver_email,
            outcome=request.outcome,
            notes=request.notes
        )
        
        # Log de auditoria
        self.audit_repo.create(
            actor=self.actor_email,
            action="CREATE",
            entity="APPROVAL",
            entity_id=approval.id,
            payload={
                "release_id": str(release_id),
                "approver_email": approver_email
            }
        )
        
        self.session.commit()
        return ApprovalResponse.from_orm(approval)

    def get_by_id(self, approval_id: UUID) -> ApprovalResponse:
        approval = self.repo.get_by_id(approval_id)
        if not approval:
            raise ValueError(f"Approval {approval_id} not found")
        return ApprovalResponse.from_orm(approval)

    def list_all(self, skip: int = 0, limit: int = 100):
        approvals = self.repo.list_all(skip, limit)
        return [ApprovalResponse.from_orm(a) for a in approvals]

    def list_by_release(self, release_id: UUID):
        approvals = self.repo.list_by_release(release_id)
        return [ApprovalResponse.from_orm(a) for a in approvals]

    def list_pending_by_approver(self, approver_email: str):
        approvals = self.repo.list_pending_by_approver(approver_email)
        return [ApprovalResponse.from_orm(a) for a in approvals]

    def approve(self, release_id: UUID, approver_email: str, notes: str = None) -> ApprovalResponse:
        """Criar um registro de aprovação (APPROVED)"""
        # Verificar se já existe uma aprovação deste usuário para este release
        existing = self.repo.list_by_release(release_id)
        for app in existing:
            if app.approver_email == approver_email:
                raise ValueError(f"User {approver_email} already approved/rejected this release")
        
        # Buscar release e aplicação para enriquecer audit log
        release = self.release_repo.get_by_id(release_id)
        if not release:
            raise ValueError(f"Release {release_id} not found")
        
        application = self.app_repo.get_by_id(release.application_id)
        app_name = application.name if application else "Unknown"
        
        # Criar novo registro de approval com outcome APPROVED
        approval = self.repo.create(
            release_id=release_id,
            approver_email=approver_email,
            outcome='APPROVED',
            notes=notes or "Aprovado"
        )
        
        # Criar evento
        self.event_repo.create(
            release_id=release_id,
            event_type='APPROVED',
            status='APPROVED',
            actor_email=approver_email,
            notes=notes or "Aprovado"
        )
        
        # Log de auditoria
        self.audit_repo.create(
            actor=approver_email,
            action="APPROVE",
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
        return ApprovalResponse.from_orm(approval)

    def reject(self, release_id: UUID, approver_email: str, notes: str = None) -> ApprovalResponse:
        """Criar um registro de rejeição (REJECTED)"""
        # Verificar se já existe uma aprovação deste usuário para este release
        existing = self.repo.list_by_release(release_id)
        for app in existing:
            if app.approver_email == approver_email:
                raise ValueError(f"User {approver_email} already approved/rejected this release")
        
        # Buscar release e aplicação para enriquecer audit log
        release = self.release_repo.get_by_id(release_id)
        if not release:
            raise ValueError(f"Release {release_id} not found")
        
        application = self.app_repo.get_by_id(release.application_id)
        app_name = application.name if application else "Unknown"
        
        # Criar novo registro de approval com outcome REJECTED
        approval = self.repo.create(
            release_id=release_id,
            approver_email=approver_email,
            outcome='REJECTED',
            notes=notes or "Rejeitado"
        )
        
        # Criar evento
        self.event_repo.create(
            release_id=release_id,
            event_type='REJECTED',
            status='REJECTED',
            actor_email=approver_email,
            notes=notes or "Rejeitado"
        )
        
        # Log de auditoria
        self.audit_repo.create(
            actor=approver_email,
            action="REJECT",
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
        return ApprovalResponse.from_orm(approval)

    def update_outcome(self, approval_id: UUID, outcome: str, notes: str = None) -> ApprovalResponse:
        approval = self.repo.get_by_id(approval_id)
        if not approval:
            raise ValueError(f"Approval {approval_id} not found")
        
        approval.outcome = outcome
        if notes:
            approval.notes = notes
        
        # Buscar informações do release e aplicação para adicionar ao audit log
        release = self.release_repo.get_by_id(approval.release_id)
        application = self.app_repo.get_by_id(release.application_id) if release else None
        app_name = application.name if application else "Unknown"
        
        self.event_repo.create(
            release_id=approval.release_id,
            event_type='APPROVED' if outcome == 'APPROVED' else 'REJECTED',
            status=outcome,
            actor_email=approval.approver_email,
            notes=notes or f"Approval {outcome}"
        )
        
        # Log de auditoria com detalhes enriquecidos
        self.audit_repo.create(
            actor=approval.approver_email,
            action="APPROVE" if outcome == 'APPROVED' else "REJECT",
            entity="APPROVAL",
            entity_id=approval_id,
            payload={
                "release_id": str(approval.release_id),
                "version": release.version if release else "N/A",
                "environment": release.env if release else "N/A",
                "application_id": str(release.application_id) if release else "N/A",
                "application_name": app_name,
                "outcome": outcome,
                "notes": notes
            }
        )
        
        self.session.commit()
        return ApprovalResponse.from_orm(approval)
