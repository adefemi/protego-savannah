from sqlalchemy.orm import Session
from sqlalchemy import desc
from . import models, schemas
from typing import List, Optional

def create_page_visit(db: Session, visit: schemas.PageVisitCreate) -> models.PageVisit:
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

def get_visits_by_url(db: Session, url: str, limit: int = 50) -> List[models.PageVisit]:
    return db.query(models.PageVisit).filter(
        models.PageVisit.url == url
    ).order_by(desc(models.PageVisit.datetime_visited), desc(models.PageVisit.id)).limit(limit).all()

def get_latest_metrics(db: Session, url: str) -> Optional[models.PageVisit]:
    return db.query(models.PageVisit).filter(
        models.PageVisit.url == url
    ).order_by(desc(models.PageVisit.datetime_visited), desc(models.PageVisit.id)).first()

