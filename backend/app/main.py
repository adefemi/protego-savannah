from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from . import models, schemas
from .database import engine, get_db
from .config import settings
from .exceptions import register_exception_handlers
from .services import PageVisitService

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name, version=settings.app_version)

register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.cors_credentials,
    allow_methods=settings.cors_methods_list,
    allow_headers=settings.cors_headers_list,
)

@app.get("/")
def root():
    return {"message": "Protego History API", "status": "running"}

@app.post("/api/visits", response_model=schemas.PageVisitResponse)
def create_visit(visit: schemas.PageVisitCreate, db: Session = Depends(get_db)):
    return PageVisitService.create_visit(db, visit)

@app.post("/api/visits/bulk", response_model=schemas.BulkPageVisitResponse)
def create_visits_bulk(bulk: schemas.BulkPageVisitCreate, db: Session = Depends(get_db)):
    return PageVisitService.create_visits_bulk(db, bulk)

@app.get("/api/visits", response_model=List[schemas.PageVisitResponse])
def get_visits(
    url: str = Query(..., description="URL to fetch visits for"),
    limit: int = Query(50, description="Maximum number of visits to return", ge=1, le=100),
    db: Session = Depends(get_db)
):
    return PageVisitService.get_visits_by_url(db, url, limit)

@app.get("/api/visits/paginated", response_model=schemas.PaginatedResponse[schemas.PageVisitResponse])
def get_visits_paginated(
    url: str = Query(..., description="URL to fetch visits for"),
    page: int = Query(1, description="Page number", ge=1),
    page_size: int = Query(50, description="Items per page", ge=1, le=100),
    db: Session = Depends(get_db)
):
    return PageVisitService.get_visits_by_url_paginated(db, url, page, page_size)

@app.delete("/api/visits")
def delete_visits(
    url: str = Query(..., description="URL to delete visits for"),
    db: Session = Depends(get_db)
):
    count = PageVisitService.delete_visits_by_url(db, url)
    return {"deleted": count, "url": url}

@app.get("/api/metrics/current", response_model=schemas.PageMetrics)
def get_current_metrics(
    url: str = Query(..., description="URL to fetch metrics for"),
    db: Session = Depends(get_db)
):
    return PageVisitService.get_latest_metrics(db, url)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

