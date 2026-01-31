from pydantic import BaseModel, ConfigDict
from typing import List, TypeVar, Generic, Optional

T = TypeVar('T')


class PaginatedResponse(BaseModel, Generic[T]):
    """Resposta paginada padrão"""
    
    model_config = ConfigDict(
        arbitrary_types_allowed=True
    )
    
    data: List[T]
    total: int
    skip: int
    limit: int
    
    @property
    def has_next(self) -> bool:
        return (self.skip + self.limit) < self.total
    
    @property
    def has_previous(self) -> bool:
        return self.skip > 0
