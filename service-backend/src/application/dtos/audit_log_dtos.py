from pydantic import BaseModel, Field
from typing import Optional, Any, Dict
from datetime import datetime
from uuid import UUID


class AuditLogResponse(BaseModel):
    id: UUID
    actor: str = Field(alias="actor")
    action: str = Field(alias="action")
    entity: str = Field(alias="entity")
    entity_id: UUID = Field(alias="entityId")
    payload: Dict[str, Any] = Field(alias="payload")
    request_id: Optional[str] = Field(alias="requestId")
    created_at: datetime = Field(alias="createdAt")

    class Config:
        from_attributes = True
        populate_by_name = True

    @staticmethod
    def from_orm(orm_object) -> "AuditLogResponse":
        return AuditLogResponse(
            id=orm_object.id,
            actor=orm_object.actor,
            action=orm_object.action,
            entity=orm_object.entity,
            entity_id=orm_object.entity_id,
            payload=orm_object.payload,
            request_id=orm_object.request_id,
            created_at=orm_object.created_at
        )
