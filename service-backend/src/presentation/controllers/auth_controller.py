from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import jwt
from datetime import datetime, timedelta, timezone
import os

from src.infrastructure.database import get_db
from src.infrastructure.repositories.user_repository import UserRepository
from src.application.services.auth_service import AuthService
from src.core.auth import extract_user_from_token

router = APIRouter(tags=["Auth"])

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret_here_change_in_prod")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))

@router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest, session: Session = Depends(get_db)):
    auth_service = AuthService(session)
    user = auth_service.authenticate(request.email, request.password)
    
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user.id,
        "email": user.email,
        "name": user.name,
        "iat": now,
        "exp": now + timedelta(hours=JWT_EXPIRATION_HOURS)
    }

    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role.value
        }
    )


@router.get("/auth/me")
async def get_current_user(
    session: Session = Depends(get_db),
    authorization: str = Header(None)
):
    """
    Retorna informações do usuário autenticado (incluindo role)

    O gateway usa este endpoint para validar a role do user
    """
    # Extrai email do token JWT
    token_payload = extract_user_from_token(authorization)

    # Busca role no banco
    user_repo = UserRepository(session)
    role = user_repo.get_role_by_email(token_payload.email)

    return {
        "email": token_payload.email,
        "name": token_payload.name,
        "role": role
    }
