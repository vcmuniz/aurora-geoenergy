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
    version_row: Optional[int] = Field(None, alias='versionRow')
    actor: Optional[str] = None


class ReleaseResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    id: str
    version: str
    environment: str = Field(alias='env')
    status: str = "DRAFT"
    application_id: str = Field(alias='applicationId')
    application_name: Optional[str] = Field(None, alias='applicationName')
    evidence_url: Optional[str] = Field(None, alias='evidenceUrl')
    evidence_score: int = Field(default=0, alias='evidenceScore')
    version_row: int = Field(default=0, alias='versionRow')
    deployed_at: Optional[datetime] = Field(None, alias='deployedAt')
    created_at: datetime = Field(alias='createdAt')
    notes: Optional[str] = None
    
    @field_validator('id', 'application_id', mode='before')
    @classmethod
    def convert_ids(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v
    
    @staticmethod
    def from_orm(obj, application_name: Optional[str] = None):
        """Convert ORM object to Response DTO, handling UUID conversion"""
        data = {
            'id': str(obj.id) if isinstance(obj.id, UUID) else obj.id,
            'version': obj.version,
            'environment': obj.env,
            'status': getattr(obj, 'status', 'DRAFT'),
            'application_id': str(obj.application_id) if isinstance(obj.application_id, UUID) else obj.application_id,
            'application_name': application_name,
            'evidence_url': getattr(obj, 'evidence_url', None),
            'evidence_score': getattr(obj, 'evidence_score', 0),
            'version_row': getattr(obj, 'version_row', 0),
            'deployed_at': getattr(obj, 'deployed_at', None),
            'created_at': obj.created_at,
            'notes': getattr(obj, 'notes', None)
        }
        return ReleaseResponse(**data)
