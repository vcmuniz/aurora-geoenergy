from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID


class ReleaseRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    version: str
    environment: Optional[str] = Field(None, alias='env')
    notes: Optional[str] = None
    application_id: str = Field(alias='applicationId')
    evidence_url: Optional[str] = Field(None, alias='evidenceUrl')
    evidence_score: Optional[int] = Field(None, alias='evidenceScore')


class ReleaseResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    id: str
    version: str
    env: str = Field(alias='environment')
    notes: Optional[str] = None
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
            'env': obj.env,
            'notes': getattr(obj, 'notes', None),
            'status': getattr(obj, 'status', 'DRAFT'),
            'application_id': str(obj.application_id) if isinstance(obj.application_id, UUID) else obj.application_id,
            'created_at': obj.created_at
        }
        return ReleaseResponse(**data)
