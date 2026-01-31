from pydantic import BaseModel, ConfigDict, Field, model_validator
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
    created_at: datetime
    
    @model_validator(mode='before')
    @classmethod
    def convert_id(cls, data):
        if isinstance(data, dict) and 'id' in data and isinstance(data['id'], UUID):
            data['id'] = str(data['id'])
        return data
