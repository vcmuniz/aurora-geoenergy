from sqlalchemy.orm import Session
from passlib.context import CryptContext
from src.infrastructure.repositories.user_repository import UserRepository
from src.domain.entities.user import User
from src.application.exceptions import AuthenticationError, UserNotFoundError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(self, session: Session):
        self.session = session
        self.user_repo = UserRepository(session)

    def authenticate(self, email: str, password: str) -> User:
        user_orm = self.user_repo.get_by_email(email)
        
        if not user_orm:
            raise UserNotFoundError(f"Usuário {email} não encontrado")
        
        if not self._verify_password(password, user_orm.password_hash):
            raise AuthenticationError("Email ou senha incorretos")
        
        return User(
            id=str(user_orm.id),
            email=user_orm.email,
            name=user_orm.name,
            role=user_orm.role,
            created_at=user_orm.created_at
        )

    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_context.hash(password)
