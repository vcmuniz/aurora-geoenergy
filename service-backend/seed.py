import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.dirname(__file__))

from src.infrastructure.database import Base
from src.infrastructure.orm.user import UserORM
from src.application.services.auth_service import AuthService

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://aurora:aurora_password@localhost:5432/aurora_db')

engine = create_engine(DATABASE_URL)
Base.metadata.create_all(bind=engine)

with Session(engine) as session:
    existing_user = session.query(UserORM).filter(UserORM.email == 'teste@example.com').first()
    if not existing_user:
        password_hash = AuthService.hash_password('senha123')
        user = UserORM(
            email='teste@example.com',
            name='Usuário Teste',
            password_hash=password_hash,
        )
        session.add(user)
        session.commit()
        print(f"✅ Usuário criado: teste@example.com / senha123")
    else:
        print("✅ Usuário já existe: teste@example.com")

engine.dispose()
