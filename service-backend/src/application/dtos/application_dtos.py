from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ApplicationRequest(BaseModel):
    name: str
    owner_team: str
    repo_url: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: str
    name: str
    owner_team: str
    repo_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
