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
        return ApprovalResponse.model_validate(approval)

    def get_by_id(self, approval_id: UUID) -> ApprovalResponse:
        approval = self.repo.get_by_id(approval_id)
        if not approval:
            raise ValueError(f"Approval {approval_id} not found")
        return ApprovalResponse.model_validate(approval)

    def list_by_release(self, release_id: UUID):
        approvals = self.repo.list_by_release(release_id)
        return [ApprovalResponse.model_validate(a) for a in approvals]

    def list_pending_by_approver(self, approver_email: str):
        approvals = self.repo.list_pending_by_approver(approver_email)
        return [ApprovalResponse.model_validate(a) for a in approvals]

    def get_latest_by_release(self, release_id: UUID) -> ApprovalResponse:
        approval = self.repo.get_latest_by_release(release_id)
        if not approval:
            raise ValueError(f"No approvals found for release {release_id}")
        return ApprovalResponse.model_validate(approval)
