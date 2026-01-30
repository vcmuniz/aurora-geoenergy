from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ErrorResponse(BaseModel):
    """Modelo padrão de resposta de erro"""
    
    error_code: str
    message: str
    details: Optional[dict] = None
    timestamp: datetime = None
    
    def __init__(self, **data):
        if 'timestamp' not in data:
            data['timestamp'] = datetime.utcnow()
        super().__init__(**data)
    
    class Config:
        json_schema_extra = {
            "example": {
                "error_code": "AUTH_INVALID_CREDENTIALS",
                "message": "Email ou senha incorretos",
                "details": None,
                "timestamp": "2026-01-30T14:03:00"
            }
        }
