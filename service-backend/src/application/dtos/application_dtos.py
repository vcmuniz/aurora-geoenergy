from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID


class ApplicationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    name: str
    owner_team: str = Field(alias='ownerTeam')
    repo_url: Optional[str] = Field(None, alias='repoUrl')


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    id: str
    name: str
    owner_team: str = Field(alias='ownerTeam')
    repo_url: Optional[str] = Field(alias='repoUrl')
    created_at: datetime = Field(alias='createdAt')
    
    @field_validator('id', mode='before')
    @classmethod
    def convert_id(cls, v):
        if isinstance(v, UUID):
            return str(v)
        return v
    
    @staticmethod
    def from_orm(obj):
        """Convert ORM object to Response DTO, handling UUID conversion"""
        data = {
            'id': str(obj.id) if isinstance(obj.id, UUID) else obj.id,
            'name': obj.name,
            'owner_team': obj.owner_team,
            'repo_url': obj.repo_url,
            'created_at': obj.created_at
        }
        return ApplicationResponse(**data)
