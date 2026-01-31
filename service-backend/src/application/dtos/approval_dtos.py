from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID


class ApprovalRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    release_id: str = Field(alias='releaseId')
    notes: Optional[str] = None


class ApprovalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    id: str
    release_id: str = Field(alias='releaseId')
    approver_id: Optional[str] = Field(None, alias='approverId')
    outcome: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    
    @field_validator('id', 'release_id', 'approver_id', mode='before')
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
            'release_id': str(obj.release_id) if isinstance(obj.release_id, UUID) else obj.release_id,
            'approver_id': str(obj.approver_id) if isinstance(obj.approver_id, UUID) else obj.approver_id,
            'outcome': obj.outcome,
            'notes': obj.notes,
            'created_at': obj.created_at
        }
        return ApprovalResponse(**data)
