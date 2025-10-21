from sqlalchemy.orm import Session
from sqlalchemy import desc
from sqlalchemy.exc import SQLAlchemyError
from . import models, schemas
from .exceptions import DatabaseException
from typing import List, Optional


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


def get_visits_by_url(db: Session, url: str, limit: int = 50) -> List[models.PageVisit]:
    try:
        return db.query(models.PageVisit).filter(
            models.PageVisit.url == url
        ).order_by(desc(models.PageVisit.datetime_visited), desc(models.PageVisit.id)).limit(limit).all()
    except SQLAlchemyError as e:
        raise DatabaseException(f"Failed to retrieve visits: {str(e)}")


def get_latest_metrics(db: Session, url: str) -> Optional[models.PageVisit]:
    try:
        return db.query(models.PageVisit).filter(
            models.PageVisit.url == url
        ).order_by(desc(models.PageVisit.datetime_visited), desc(models.PageVisit.id)).first()
    except SQLAlchemyError as e:
        raise DatabaseException(f"Failed to retrieve metrics: {str(e)}")

