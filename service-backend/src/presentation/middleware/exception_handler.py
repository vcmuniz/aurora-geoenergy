from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import logging
from uuid import uuid4

from src.application.exceptions import ApplicationException
from src.application.dtos.api_response import ApiResponse

logger = logging.getLogger(__name__)


def setup_exception_handlers(app: FastAPI):
    """Configura handlers de exceção globais para a aplicação"""
    
    @app.exception_handler(ApplicationException)
    async def application_exception_handler(request: Request, exc: ApplicationException):
        """Handler para ApplicationException e subclasses"""
        request_id = getattr(request.state, 'request_id', str(uuid4()))
        
        logger.warning(
            f"ApplicationException: {exc.error_code} - {exc.message}",
            extra={"path": request.url.path, "method": request.method, "request_id": request_id}
        )
        
        response = ApiResponse.error_response(
            code=exc.error_code,
            message=exc.message,
            details=exc.details if exc.details else None,
            request_id=request_id
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content=response.model_dump(exclude_none=True)
        )
    
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """Handler para exceções não tratadas"""
        request_id = getattr(request.state, 'request_id', str(uuid4()))
        
        logger.error(
            f"Unhandled exception: {str(exc)}",
            extra={"path": request.url.path, "method": request.method, "request_id": request_id},
            exc_info=True
        )
        
        response = ApiResponse.error_response(
            code="INTERNAL_SERVER_ERROR",
            message="Erro interno do servidor",
            details=None,
            request_id=request_id
        )
        
        return JSONResponse(
            status_code=500,
            content=response.model_dump(exclude_none=True)
        )
