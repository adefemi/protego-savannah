from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from . import models, schemas, crud
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Protego History API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Protego History API", "status": "running"}

@app.post("/api/visits", response_model=schemas.PageVisitResponse)
def create_visit(visit: schemas.PageVisitCreate, db: Session = Depends(get_db)):
    return crud.create_page_visit(db=db, visit=visit)

@app.get("/api/visits", response_model=List[schemas.PageVisitResponse])
def get_visits(url: str = Query(..., description="URL to fetch visits for"), db: Session = Depends(get_db)):
    visits = crud.get_visits_by_url(db=db, url=url)
    return visits

@app.get("/api/metrics/current", response_model=schemas.PageMetrics)
def get_current_metrics(url: str = Query(..., description="URL to fetch metrics for"), db: Session = Depends(get_db)):
    latest = crud.get_latest_metrics(db=db, url=url)
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

@app.get("/health")
def health_check():
    return {"status": "healthy"}

