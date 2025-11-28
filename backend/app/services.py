from sqlalchemy.orm import Session
from typing import List, Optional
import math
from . import crud, schemas, models
from .exceptions import NotFoundException, ValidationException
from .utils import validate_url


class PageVisitService:
    @staticmethod
    def create_visit(db: Session, visit: schemas.PageVisitCreate) -> schemas.PageVisitResponse:
        normalized_url = validate_url(visit.url)
        
        if visit.link_count < 0 or visit.word_count < 0 or visit.image_count < 0:
            raise ValidationException("Counts cannot be negative")
        
        visit.url = normalized_url
        db_visit = crud.create_page_visit(db, visit)
        return schemas.PageVisitResponse.model_validate(db_visit)
    
    @staticmethod
    def create_visits_bulk(db: Session, bulk: schemas.BulkPageVisitCreate) -> schemas.BulkPageVisitResponse:
        if not bulk.visits:
            raise ValidationException("No visits provided")
        
        if len(bulk.visits) > 100:
            raise ValidationException("Cannot create more than 100 visits at once")
        
        validated_visits = []
        failed_count = 0
        
        for visit in bulk.visits:
            try:
                normalized_url = validate_url(visit.url)
                if visit.link_count < 0 or visit.word_count < 0 or visit.image_count < 0:
                    failed_count += 1
                    continue
                visit.url = normalized_url
                validated_visits.append(visit)
            except ValidationException:
                failed_count += 1
                continue
        
        db_visits = crud.create_page_visits_bulk(db, validated_visits)
        responses = [schemas.PageVisitResponse.model_validate(v) for v in db_visits]
        
        return schemas.BulkPageVisitResponse(
            created=len(responses),
            failed=failed_count,
            results=responses
        )
    
    @staticmethod
    def get_visits_by_url(db: Session, url: str, limit: int = 50) -> List[schemas.PageVisitResponse]:
        normalized_url = validate_url(url)
        
        if limit < 1 or limit > 100:
            raise ValidationException("Limit must be between 1 and 100")
        
        visits = crud.get_visits_by_url(db, normalized_url, limit)
        return [schemas.PageVisitResponse.model_validate(visit) for visit in visits]
    
    @staticmethod
    def get_visits_by_url_paginated(
        db: Session, 
        url: str, 
        page: int = 1, 
        page_size: int = 50
    ) -> schemas.PaginatedResponse[schemas.PageVisitResponse]:
        normalized_url = validate_url(url)
        
        if page < 1:
            raise ValidationException("Page must be >= 1")
        
        if page_size < 1 or page_size > 100:
            raise ValidationException("Page size must be between 1 and 100")
        
        visits, total = crud.get_visits_by_url_paginated(db, normalized_url, page, page_size)
        total_pages = math.ceil(total / page_size) if total > 0 else 0
        
        return schemas.PaginatedResponse(
            data=[schemas.PageVisitResponse.model_validate(visit) for visit in visits],
            meta=schemas.PaginationMeta(
                total=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages,
                has_next=page < total_pages,
                has_prev=page > 1
            )
        )
    
    @staticmethod
    def get_latest_metrics(db: Session, url: str) -> schemas.PageMetrics:
        normalized_url = validate_url(url)
        
        latest = crud.get_latest_metrics(db, normalized_url)
        
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
    
    @staticmethod
    def delete_visits_by_url(db: Session, url: str) -> int:
        normalized_url = validate_url(url)
        return crud.delete_visits_by_url(db, normalized_url)

