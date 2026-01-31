from pydantic import BaseModel, ConfigDict, Field, field_serializer
from typing import Optional
from datetime import datetime
from uuid import UUID


class ReleaseRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    application_id: str = Field(alias='applicationId')
    version: str
    env: str  # DEV, PRE_PROD, PROD
    evidence_url: Optional[str] = Field(None, alias='evidenceUrl')
    evidence_score: Optional[int] = Field(0, alias='evidenceScore')


class ReleaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    id: str
    application_id: str = Field(alias='applicationId')
    version: str
    env: str
    status: str  # PENDING, APPROVED, DEPLOYED, REJECTED
    evidence_url: Optional[str] = Field(alias='evidenceUrl')
    evidence_score: int = Field(alias='evidenceScore')
    version_row: int = Field(alias='versionRow')
    created_at: datetime = Field(alias='createdAt')
    deployed_at: Optional[datetime] = Field(alias='deployedAt')
    
    @field_serializer('id')
    def serialize_id(self, value):
        if isinstance(value, UUID):
            return str(value)
        return value
