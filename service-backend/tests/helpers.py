from src.application.services.auth_service import AuthService
from src.infrastructure.orm.user import UserORM
from src.domain.entities.user import UserRole


def create_test_user(db_session, email='teste@example.com', password='senha123'):
    """Cria usuário de teste no banco em memória"""
    hashed_pwd = AuthService.hash_password(password)
    user = UserORM(
        email=email,
        name='Teste User',
        password_hash=hashed_pwd,
        role=UserRole.VIEWER
    )
    db_session.add(user)
    db_session.commit()
    return user
