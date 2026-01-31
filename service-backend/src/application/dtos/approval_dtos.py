from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import Optional
from datetime import datetime
from uuid import UUID


class ApprovalRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    release_id: str = Field(alias='releaseId')
    outcome: str  # APPROVED, REJECTED
    notes: Optional[str] = None


class ApprovalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    id: str
    release_id: str = Field(alias='releaseId')
    approver_email: str = Field(alias='approverEmail')
    outcome: str
    notes: Optional[str]
    created_at: datetime = Field(alias='createdAt')
    
    @model_validator(mode='before')
    @classmethod
    def convert_ids(cls, data):
        if isinstance(data, dict):
            if 'id' in data and isinstance(data['id'], UUID):
                data['id'] = str(data['id'])
            if 'release_id' in data and isinstance(data['release_id'], UUID):
                data['release_id'] = str(data['release_id'])
        return data
