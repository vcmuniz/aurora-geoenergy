from datetime import datetime
from typing import Optional, Dict, Any

class AuditLog:
    def __init__(
        self,
        id: str,
        actor: str,
        action: str,
        entity: str,
        entity_id: str,
        payload: Dict[str, Any],
        request_id: Optional[str] = None,
        created_at: Optional[datetime] = None
    ):
        self.id = id
        self.actor = actor
        self.action = action
        self.entity = entity
        self.entity_id = entity_id
        self.payload = payload
        self.request_id = request_id
        self.created_at = created_at or datetime.utcnow()

    def __repr__(self):
        return f"<AuditLog id={self.id} action={self.action} entity={self.entity} entity_id={self.entity_id}>"
