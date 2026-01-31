from uuid import UUID
from sqlalchemy.orm import Session
from src.infrastructure.repositories.release_event_repository import ReleaseEventRepository
from src.application.dtos.release_event_dtos import ReleaseEventResponse


class ReleaseEventUseCase:
    def __init__(self, session: Session):
        self.repo = ReleaseEventRepository(session)
        self.session = session

    def create_event(self, release_id: UUID, event_type: str, status: str, actor_email: str = None, notes: str = None) -> ReleaseEventResponse:
        event = self.repo.create(release_id, event_type, status, actor_email, notes)
        self.session.commit()
        return ReleaseEventResponse.from_orm(event)

    def get_timeline(self, release_id: UUID):
        events = self.repo.list_by_release(release_id)
        return [ReleaseEventResponse.from_orm(e) for e in events]
