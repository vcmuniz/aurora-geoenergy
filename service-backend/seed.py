import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.dirname(__file__))

from src.infrastructure.database import Base
from src.infrastructure.orm.user import UserORM
from src.domain.entities.user import UserRole
from src.application.services.auth_service import AuthService

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://aurora:aurora_password@localhost:5432/aurora_db')

engine = create_engine(DATABASE_URL)
Base.metadata.create_all(bind=engine)

# Usuários a serem criados
test_users = [
    {
        'email': 'admin@company.co',
        'name': 'Administrador',
        'password': 'password123',
        'role': UserRole.ADMIN
    },
    {
        'email': 'approver@company.co',
        'name': 'Aprovador',
        'password': 'password123',
        'role': UserRole.APPROVER
    },
    {
        'email': 'viewer@company.co',
        'name': 'Visualizador',
        'password': 'password123',
        'role': UserRole.VIEWER
    }
]

with Session(engine) as session:
    for user_data in test_users:
        existing_user = session.query(UserORM).filter(UserORM.email == user_data['email']).first()
        if not existing_user:
            password_hash = AuthService.hash_password(user_data['password'])
            user = UserORM(
                email=user_data['email'],
                name=user_data['name'],
                password_hash=password_hash,
                role=user_data['role']
            )
            session.add(user)
            session.commit()
            print(f"✅ Usuário criado: {user_data['email']} ({user_data['role'].value}) / {user_data['password']}")
        else:
            print(f"✅ Usuário já existe: {user_data['email']}")

engine.dispose()
