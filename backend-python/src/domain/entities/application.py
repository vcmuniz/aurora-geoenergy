from datetime import datetime
from typing import Optional

class Application:
    def __init__(
        self,
        id: str,
        name: str,
        owner_team: Optional[str] = None,
        repo_url: Optional[str] = None,
        created_at: Optional[datetime] = None
    ):
        self.id = id
        self.name = name
        self.owner_team = owner_team
        self.repo_url = repo_url
        self.created_at = created_at or datetime.utcnow()

    def __repr__(self):
        return f"<Application id={self.id} name={self.name}>"
