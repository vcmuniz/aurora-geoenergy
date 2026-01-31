from uuid import UUID
from sqlalchemy.orm import Session
from src.infrastructure.repositories.release_repository import ReleaseRepository
from src.application.dtos.release_dtos import ReleaseRequest, ReleaseResponse


class ReleaseUseCase:
    def __init__(self, session: Session):
        self.repo = ReleaseRepository(session)
        self.session = session

    def create(self, request: ReleaseRequest) -> ReleaseResponse:
        app_id = UUID(request.application_id)
        
        existing = self.repo.get_by_app_version_env(app_id, request.version, request.environment)
        if existing:
            raise ValueError(f"Release {request.version} for env {request.environment} already exists")
        
        release = self.repo.create(
            application_id=app_id,
            version=request.version,
            env=request.environment,
            evidence_url=request.evidence_url,
            evidence_score=request.evidence_score or 0
        )
        self.session.commit()
        return ReleaseResponse.from_orm(release)

    def get_by_id(self, release_id: UUID) -> ReleaseResponse:
        release = self.repo.get_by_id(release_id)
        if not release:
            raise ValueError(f"Release {release_id} not found")
        return ReleaseResponse.model_validate(release)

    def list_by_application(self, app_id: UUID, skip: int = 0, limit: int = 100):
        releases = self.repo.list_by_application(app_id, skip, limit)
        return [ReleaseResponse.model_validate(r) for r in releases]

    def list_by_status(self, status: str, skip: int = 0, limit: int = 100):
        releases = self.repo.list_by_status(status, skip, limit)
        return [ReleaseResponse.model_validate(r) for r in releases]

    def update_status(self, release_id: UUID, status: str) -> ReleaseResponse:
        release = self.repo.update_status(release_id, status)
        if not release:
            raise ValueError(f"Release {release_id} not found")
        self.session.commit()
        return ReleaseResponse.model_validate(release)

    def delete(self, release_id: UUID) -> bool:
        deleted = self.repo.delete(release_id)
        if not deleted:
            raise ValueError(f"Release {release_id} not found")
        self.session.commit()
        return True
