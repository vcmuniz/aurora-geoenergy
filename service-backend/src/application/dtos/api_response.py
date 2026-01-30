from pydantic import BaseModel, ConfigDict, field_serializer
from typing import Optional, Generic, TypeVar
from datetime import datetime, timezone
from uuid import UUID

T = TypeVar('T')


class ErrorDetail(BaseModel):
    """Detalhe de erro"""
    code: str
    message: str
    details: Optional[dict] = None


class ApiResponse(BaseModel, Generic[T]):
    """Modelo padrão de resposta da API - Unificado"""
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "data": {"id": "...", "email": "user@example.com"},
                "error": None,
                "requestId": "550e8400-e29b-41d4-a716-446655440000",
                "timestamp": "2026-01-30T14:03:00"
            }
        }
    )
    
    success: bool
    data: Optional[T] = None
    error: Optional[ErrorDetail] = None
    requestId: Optional[str] = None
    timestamp: datetime = None
    
    def __init__(self, **data):
        if 'timestamp' not in data:
            data['timestamp'] = datetime.now(timezone.utc)
        super().__init__(**data)
    
    @field_serializer('timestamp')
    def serialize_timestamp(self, value: datetime):
        return value.isoformat() if value else None
    
    @staticmethod
    def success_response(data: T, request_id: Optional[str] = None) -> 'ApiResponse':
        """Resposta de sucesso"""
        return ApiResponse(
            success=True,
            data=data,
            error=None,
            requestId=request_id,
            timestamp=datetime.now(timezone.utc)
        )
    
    @staticmethod
    def error_response(
        code: str,
        message: str,
        details: Optional[dict] = None,
        request_id: Optional[str] = None
    ) -> 'ApiResponse':
        """Resposta de erro"""
        return ApiResponse(
            success=False,
            data=None,
            error=ErrorDetail(code=code, message=message, details=details),
            requestId=request_id,
            timestamp=datetime.now(timezone.utc)
        )
