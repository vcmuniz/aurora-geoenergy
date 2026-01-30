from fastapi import HTTPException, status
from jose import jwt, JWTError
import os
from typing import NamedTuple


class TokenPayload(NamedTuple):
    email: str
    name: str


JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret_here_change_in_prod")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


def extract_user_from_token(authorization: str) -> TokenPayload:
    """Extrai dados do usuário do token JWT"""
    
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token não fornecido"
        )
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError("Scheme inválido")
    except (ValueError, IndexError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("email")
        name = payload.get("name")
        
        if not email or not name:
            raise ValueError("Claims inválidos")
        
        return TokenPayload(email=email, name=name)
    
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado"
        )
