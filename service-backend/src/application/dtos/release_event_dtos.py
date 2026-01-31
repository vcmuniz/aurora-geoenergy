from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID


class ReleaseEventResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    id: str
    release_id: str = Field(alias='releaseId')
    event_type: str = Field(alias='eventType')
    status: str
    actor_email: Optional[str] = Field(None, alias='actorEmail')
    notes: Optional[str] = None
    created_at: datetime = Field(alias='createdAt')
    
    @field_validator('id', 'release_id', mode='before')
    @classmethod
    def convert_ids(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v
    
    @staticmethod
    def from_orm(obj):
        """Convert ORM object to Response DTO"""
        data = {
            'id': str(obj.id) if isinstance(obj.id, UUID) else obj.id,
            'release_id': str(obj.release_id) if isinstance(obj.release_id, UUID) else obj.release_id,
            'event_type': obj.event_type,
            'status': obj.status,
            'actor_email': obj.actor_email,
            'notes': obj.notes,
            'created_at': obj.created_at
        }
        return ReleaseEventResponse(**data)
