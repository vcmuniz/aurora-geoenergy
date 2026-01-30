from enum import Enum
from datetime import datetime, timezone

class UserRole(str, Enum):
    ADMIN = "admin"
    APPROVER = "approver"
    VIEWER = "viewer"

class User:
    def __init__(self, id: str, email: str, name: str, role: UserRole, created_at: datetime = None):
        self.id = id
        self.email = email
        self.name = name
        self.role = role
        self.created_at = created_at or datetime.now(timezone.utc)
