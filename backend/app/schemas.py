from pydantic import BaseModel, HttpUrl
from datetime import datetime
from typing import Optional, List, Generic, TypeVar

class PageVisitCreate(BaseModel):
    url: str
    link_count: int
    word_count: int
    image_count: int

class PageVisitResponse(BaseModel):
    id: int
    url: str
    datetime_visited: datetime
    link_count: int
    word_count: int
    image_count: int

    class Config:
        from_attributes = True

class PageMetrics(BaseModel):
    link_count: int
    word_count: int
    image_count: int
    last_visited: Optional[datetime] = None

class PaginationMeta(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    meta: PaginationMeta

class BulkPageVisitCreate(BaseModel):
    visits: List[PageVisitCreate]

class BulkPageVisitResponse(BaseModel):
    created: int
    failed: int
    results: List[PageVisitResponse]

