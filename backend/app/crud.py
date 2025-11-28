from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from sqlalchemy.exc import SQLAlchemyError
from . import models, schemas
from .exceptions import DatabaseException
from typing import List, Optional, Tuple


def create_page_visit(db: Session, visit: schemas.PageVisitCreate) -> models.PageVisit:
    try:
        db_visit = models.PageVisit(
            url=visit.url,
            link_count=visit.link_count,
            word_count=visit.word_count,
            image_count=visit.image_count
        )
        db.add(db_visit)
        db.commit()
        db.refresh(db_visit)
        return db_visit
    except SQLAlchemyError as e:
        db.rollback()
        raise DatabaseException(f"Failed to create page visit: {str(e)}")


def create_page_visits_bulk(db: Session, visits: List[schemas.PageVisitCreate]) -> List[models.PageVisit]:
    try:
        db_visits = [
            models.PageVisit(
                url=visit.url,
                link_count=visit.link_count,
                word_count=visit.word_count,
                image_count=visit.image_count
            )
            for visit in visits
        ]
        db.add_all(db_visits)
        db.commit()
        for visit in db_visits:
            db.refresh(visit)
        return db_visits
    except SQLAlchemyError as e:
        db.rollback()
        raise DatabaseException(f"Failed to create page visits: {str(e)}")


def get_visits_by_url(db: Session, url: str, limit: int = 50) -> List[models.PageVisit]:
    try:
        return db.query(models.PageVisit).filter(
            models.PageVisit.url == url
        ).order_by(desc(models.PageVisit.datetime_visited), desc(models.PageVisit.id)).limit(limit).all()
    except SQLAlchemyError as e:
        raise DatabaseException(f"Failed to retrieve visits: {str(e)}")


def get_visits_by_url_paginated(
    db: Session, 
    url: str, 
    page: int = 1, 
    page_size: int = 50
) -> Tuple[List[models.PageVisit], int]:
    try:
        query = db.query(models.PageVisit).filter(models.PageVisit.url == url)
        total = query.count()
        
        visits = query.order_by(
            desc(models.PageVisit.datetime_visited), 
            desc(models.PageVisit.id)
        ).offset((page - 1) * page_size).limit(page_size).all()
        
        return visits, total
    except SQLAlchemyError as e:
        raise DatabaseException(f"Failed to retrieve visits: {str(e)}")


def get_latest_metrics(db: Session, url: str) -> Optional[models.PageVisit]:
    try:
        return db.query(models.PageVisit).filter(
            models.PageVisit.url == url
        ).order_by(desc(models.PageVisit.datetime_visited), desc(models.PageVisit.id)).first()
    except SQLAlchemyError as e:
        raise DatabaseException(f"Failed to retrieve metrics: {str(e)}")


def delete_visits_by_url(db: Session, url: str) -> int:
    try:
        count = db.query(models.PageVisit).filter(models.PageVisit.url == url).delete()
        db.commit()
        return count
    except SQLAlchemyError as e:
        db.rollback()
        raise DatabaseException(f"Failed to delete visits: {str(e)}")

