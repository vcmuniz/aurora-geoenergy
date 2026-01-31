from uuid import UUID
from sqlalchemy.orm import Session
from src.infrastructure.repositories.approval_repository import ApprovalRepository
from src.application.dtos.approval_dtos import ApprovalRequest, ApprovalResponse


class ApprovalUseCase:
    def __init__(self, session: Session):
        self.repo = ApprovalRepository(session)
        self.session = session

    def create(self, release_id: UUID, approver_email: str, request: ApprovalRequest) -> ApprovalResponse:
        approval = self.repo.create(
            release_id=release_id,
            approver_email=approver_email,
            outcome=request.outcome,
            notes=request.notes
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

    def update_outcome(self, approval_id: UUID, outcome: str, notes: str = None) -> ApprovalResponse:
        approval = self.repo.get_by_id(approval_id)
        if not approval:
            raise ValueError(f"Approval {approval_id} not found")
        
        approval.outcome = outcome
        if notes:
            approval.notes = notes
        
        self.session.commit()
        return ApprovalResponse.from_orm(approval)
