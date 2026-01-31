from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from src.infrastructure.repositories.application_repository import ApplicationRepository
from src.application.dtos.application_dtos import ApplicationRequest, ApplicationResponse
from src.application.dtos.pagination_dto import PaginatedResponse


class ApplicationUseCase:
    def __init__(self, session: Session):
        self.repo = ApplicationRepository(session)
        self.session = session

    def create(self, request: ApplicationRequest) -> ApplicationResponse:
        existing = self.repo.get_by_name(request.name)
        if existing:
            raise ValueError(f"Application '{request.name}' already exists")
        
        app = self.repo.create(
            name=request.name,
            owner_team=request.owner_team,
            repo_url=request.repo_url
        )
        self.session.commit()
        return ApplicationResponse.model_validate(app)

    def get_by_id(self, app_id: UUID) -> ApplicationResponse:
        app = self.repo.get_by_id(app_id)
        if not app:
            raise ValueError(f"Application {app_id} not found")
        return ApplicationResponse.model_validate(app)

    def list_all(self, skip: int = 0, limit: int = 100) -> PaginatedResponse[ApplicationResponse]:
        apps = self.repo.list_all(skip, limit)
        total = self.repo.count_all()
        data = [ApplicationResponse.model_validate(app) for app in apps]
        return PaginatedResponse(data=data, total=total, skip=skip, limit=limit)

    def update(self, app_id: UUID, request: ApplicationRequest) -> ApplicationResponse:
        app = self.repo.update(app_id, request.name, request.owner_team, request.repo_url)
        if not app:
            raise ValueError(f"Application {app_id} not found")
        self.session.commit()
        return ApplicationResponse.model_validate(app)

    def delete(self, app_id: UUID) -> bool:
        deleted = self.repo.delete(app_id)
        if not deleted:
            raise ValueError(f"Application {app_id} not found")
        self.session.commit()
        return True
