from pydantic import BaseModel, ConfigDict, Field, model_validator
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
    
    @model_validator(mode='before')
    @classmethod
    def convert_ids(cls, data):
        if isinstance(data, dict):
            if 'id' in data and isinstance(data['id'], UUID):
                data['id'] = str(data['id'])
            if 'application_id' in data and isinstance(data['application_id'], UUID):
                data['application_id'] = str(data['application_id'])
        return data
