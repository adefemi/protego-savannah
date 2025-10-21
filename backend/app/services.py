from sqlalchemy.orm import Session
from typing import List, Optional
from . import crud, schemas, models
from .exceptions import NotFoundException, ValidationException


class PageVisitService:
    @staticmethod
    def create_visit(db: Session, visit: schemas.PageVisitCreate) -> schemas.PageVisitResponse:
        if not visit.url or not visit.url.strip():
            raise ValidationException("URL cannot be empty")
        
        if visit.link_count < 0 or visit.word_count < 0 or visit.image_count < 0:
            raise ValidationException("Counts cannot be negative")
        
        db_visit = crud.create_page_visit(db, visit)
        return schemas.PageVisitResponse.model_validate(db_visit)
    
    @staticmethod
    def get_visits_by_url(db: Session, url: str, limit: int = 50) -> List[schemas.PageVisitResponse]:
        if not url or not url.strip():
            raise ValidationException("URL cannot be empty")
        
        if limit < 1 or limit > 100:
            raise ValidationException("Limit must be between 1 and 100")
        
        visits = crud.get_visits_by_url(db, url, limit)
        return [schemas.PageVisitResponse.model_validate(visit) for visit in visits]
    
    @staticmethod
    def get_latest_metrics(db: Session, url: str) -> schemas.PageMetrics:
        if not url or not url.strip():
            raise ValidationException("URL cannot be empty")
        
        latest = crud.get_latest_metrics(db, url)
        
        if not latest:
            return schemas.PageMetrics(
                link_count=0,
                word_count=0,
                image_count=0,
                last_visited=None
            )
        
        return schemas.PageMetrics(
            link_count=latest.link_count,
            word_count=latest.word_count,
            image_count=latest.image_count,
            last_visited=latest.datetime_visited
        )

