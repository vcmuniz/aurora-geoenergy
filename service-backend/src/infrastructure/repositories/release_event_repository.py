from uuid import UUID
from sqlalchemy.orm import Session
from src.infrastructure.orm.release_event import ReleaseEventORM


class ReleaseEventRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, release_id: UUID, event_type: str, status: str = None, actor_email: str = None, notes: str = None) -> ReleaseEventORM:
        event = ReleaseEventORM(
            release_id=release_id,
            event_type=event_type,
            status=status,
            actor_email=actor_email,
            notes=notes
        )
        self.session.add(event)
        self.session.flush()
        return event

    def list_by_release(self, release_id: UUID):
        return self.session.query(ReleaseEventORM).filter(
            ReleaseEventORM.release_id == release_id
        ).order_by(ReleaseEventORM.created_at.asc()).all()
