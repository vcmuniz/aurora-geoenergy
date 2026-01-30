from sqlalchemy.orm import Session
from sqlalchemy import and_
from uuid import UUID
from src.infrastructure.orm.user import UserORM
from src.domain.entities.user import User, UserRole


class UserRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_email(self, email: str) -> UserORM | None:
        return self.session.query(UserORM).filter(UserORM.email == email).first()

    def get_by_id(self, user_id: UUID) -> UserORM | None:
        return self.session.query(UserORM).filter(UserORM.id == user_id).first()

    def get_role_by_email(self, email: str) -> UserRole | None:
        user = self.get_by_email(email)
        return user.role if user else None
