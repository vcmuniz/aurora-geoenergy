from pydantic import BaseModel, ConfigDict, Field, field_serializer
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
    
    @field_serializer('id')
    def serialize_id(self, value):
        if isinstance(value, UUID):
            return str(value)
        return value
