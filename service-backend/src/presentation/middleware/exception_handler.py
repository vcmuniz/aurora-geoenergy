from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import logging

from src.application.exceptions import ApplicationException
from src.application.dtos.error_response import ErrorResponse

logger = logging.getLogger(__name__)


def setup_exception_handlers(app: FastAPI):
    """Configura handlers de exceção globais para a aplicação"""
    
    @app.exception_handler(ApplicationException)
    async def application_exception_handler(request: Request, exc: ApplicationException):
        """Handler para ApplicationException e subclasses"""
        logger.warning(
            f"ApplicationException: {exc.error_code} - {exc.message}",
            extra={"path": request.url.path, "method": request.method}
        )
        
        error_response = ErrorResponse(
            error_code=exc.error_code,
            message=exc.message,
            details=exc.details if exc.details else None
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response.model_dump(exclude_none=True)
        )
    
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """Handler para exceções não tratadas"""
        logger.error(
            f"Unhandled exception: {str(exc)}",
            extra={"path": request.url.path, "method": request.method},
            exc_info=True
        )
        
        error_response = ErrorResponse(
            error_code="INTERNAL_SERVER_ERROR",
            message="Erro interno do servidor",
            details=None
        )
        
        return JSONResponse(
            status_code=500,
            content=error_response.model_dump(exclude_none=True)
        )
