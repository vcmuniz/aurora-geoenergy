from fastapi import Request
from uuid import uuid4
import logging

logger = logging.getLogger(__name__)


async def request_id_middleware(request: Request, call_next):
    """Middleware para adicionar request_id a cada requisição"""
    
    # Extrai request_id do header ou gera um novo
    request_id = request.headers.get("X-Request-ID") or str(uuid4())
    
    # Adiciona ao state da requisição
    request.state.request_id = request_id
    
    # Adiciona ao response header
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    
    logger.info(
        f"{request.method} {request.url.path}",
        extra={"request_id": request_id, "status": response.status_code}
    )
    
    return response
