from uuid import UUID
from sqlalchemy.orm import Session
from src.infrastructure.orm.application import ApplicationORM


class ApplicationRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, name: str, owner_team: str, repo_url: str = None) -> ApplicationORM:
        app = ApplicationORM(name=name, owner_team=owner_team, repo_url=repo_url)
        self.session.add(app)
        self.session.flush()
        return app

    def get_by_id(self, app_id: UUID) -> ApplicationORM:
        return self.session.query(ApplicationORM).filter(ApplicationORM.id == app_id).first()

    def get_by_name(self, name: str) -> ApplicationORM:
        return self.session.query(ApplicationORM).filter(ApplicationORM.name == name).first()

    def list_all(self, skip: int = 0, limit: int = 100):
        return self.session.query(ApplicationORM).offset(skip).limit(limit).all()

    def update(self, app_id: UUID, name: str = None, owner_team: str = None, repo_url: str = None) -> ApplicationORM:
        app = self.get_by_id(app_id)
        if app:
            if name:
                app.name = name
            if owner_team:
                app.owner_team = owner_team
            if repo_url is not None:
                app.repo_url = repo_url
            self.session.flush()
        return app

    def delete(self, app_id: UUID) -> bool:
        app = self.get_by_id(app_id)
        if app:
            self.session.delete(app)
            self.session.flush()
            return True
        return False
