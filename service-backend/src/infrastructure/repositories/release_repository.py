from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from src.infrastructure.orm.release import ReleaseORM


class ReleaseRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, application_id: UUID, version: str, env: str, status: str = "PENDING", 
               evidence_url: str = None, evidence_score: int = 0) -> ReleaseORM:
        release = ReleaseORM(
            application_id=application_id,
            version=version,
            env=env,
            status=status,
            evidence_url=evidence_url,
            evidence_score=evidence_score
        )
        self.session.add(release)
        self.session.flush()
        return release

    def get_by_id(self, release_id: UUID) -> ReleaseORM:
        return self.session.query(ReleaseORM).filter(ReleaseORM.id == release_id).first()

    def get_by_app_version_env(self, application_id: UUID, version: str, env: str) -> ReleaseORM:
        return self.session.query(ReleaseORM).filter(
            ReleaseORM.application_id == application_id,
            ReleaseORM.version == version,
            ReleaseORM.env == env
        ).first()

    def list_by_application(self, application_id: UUID, skip: int = 0, limit: int = 100):
        return self.session.query(ReleaseORM).filter(
            ReleaseORM.application_id == application_id
        ).offset(skip).limit(limit).all()

    def list_by_status(self, status: str, skip: int = 0, limit: int = 100):
        return self.session.query(ReleaseORM).filter(
            ReleaseORM.status == status
        ).offset(skip).limit(limit).all()

    def update_status(self, release_id: UUID, status: str) -> ReleaseORM:
        release = self.get_by_id(release_id)
        if release:
            release.status = status
            self.session.flush()
        return release

    def delete(self, release_id: UUID) -> bool:
        release = self.get_by_id(release_id)
        if release:
            self.session.delete(release)
            self.session.flush()
            return True
        return False
