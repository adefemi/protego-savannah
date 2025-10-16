from pydantic import BaseModel, HttpUrl
from datetime import datetime
from typing import Optional

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

