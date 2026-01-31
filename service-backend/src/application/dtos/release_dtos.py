from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID


class ReleaseRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    version: str
    environment: str = Field(alias='environment')
    notes: Optional[str] = None
    application_id: str = Field(alias='applicationId')


class ReleaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    id: str
    version: str
    environment: str
    notes: Optional[str]
    status: str = "DRAFT"
    application_id: str = Field(alias='applicationId')
    created_at: datetime
    
    @field_validator('id', 'application_id', mode='before')
    @classmethod
    def convert_ids(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v
    
    @staticmethod
    def from_orm(obj):
        """Convert ORM object to Response DTO, handling UUID conversion"""
        data = {
            'id': str(obj.id) if isinstance(obj.id, UUID) else obj.id,
            'version': obj.version,
            'environment': obj.environment,
            'notes': obj.notes,
            'status': obj.status,
            'application_id': str(obj.application_id) if isinstance(obj.application_id, UUID) else obj.application_id,
            'created_at': obj.created_at
        }
        return ReleaseResponse(**data)
