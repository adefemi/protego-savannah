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
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_credentials,
    allow_methods=settings.cors_methods,
    allow_headers=settings.cors_headers,
)

@app.get("/")
def root():
    return {"message": "Protego History API", "status": "running"}

@app.post("/api/visits", response_model=schemas.PageVisitResponse)
def create_visit(visit: schemas.PageVisitCreate, db: Session = Depends(get_db)):
    return PageVisitService.create_visit(db, visit)

@app.get("/api/visits", response_model=List[schemas.PageVisitResponse])
def get_visits(
    url: str = Query(..., description="URL to fetch visits for"),
    limit: int = Query(50, description="Maximum number of visits to return", ge=1, le=100),
    db: Session = Depends(get_db)
):
    return PageVisitService.get_visits_by_url(db, url, limit)

@app.get("/api/metrics/current", response_model=schemas.PageMetrics)
def get_current_metrics(
    url: str = Query(..., description="URL to fetch metrics for"),
    db: Session = Depends(get_db)
):
    return PageVisitService.get_latest_metrics(db, url)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

