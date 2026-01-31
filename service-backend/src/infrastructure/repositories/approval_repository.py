from uuid import UUID
from sqlalchemy.orm import Session
from src.infrastructure.orm.approval import ApprovalORM


class ApprovalRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, release_id: UUID, approver_email: str, outcome: str, notes: str = None) -> ApprovalORM:
        approval = ApprovalORM(
            release_id=release_id,
            approver_email=approver_email,
            outcome=outcome,
            notes=notes
        )
        self.session.add(approval)
        self.session.flush()
        return approval

    def get_by_id(self, approval_id: UUID) -> ApprovalORM:
        return self.session.query(ApprovalORM).filter(ApprovalORM.id == approval_id).first()

    def list_by_release(self, release_id: UUID):
        return self.session.query(ApprovalORM).filter(
            ApprovalORM.release_id == release_id
        ).all()

    def list_pending_by_approver(self, approver_email: str):
        return self.session.query(ApprovalORM).filter(
            ApprovalORM.approver_email == approver_email
        ).order_by(ApprovalORM.created_at.desc()).all()

    def get_latest_by_release(self, release_id: UUID) -> ApprovalORM:
        return self.session.query(ApprovalORM).filter(
            ApprovalORM.release_id == release_id
        ).order_by(ApprovalORM.created_at.desc()).first()
