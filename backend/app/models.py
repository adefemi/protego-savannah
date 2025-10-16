from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from .database import Base

class PageVisit(Base):
    __tablename__ = "page_visits"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(Text, nullable=False, index=True)
    datetime_visited = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    link_count = Column(Integer, default=0)
    word_count = Column(Integer, default=0)
    image_count = Column(Integer, default=0)

