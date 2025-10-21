import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from starlette.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app import schemas

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app, raise_server_exceptions=False)
    yield test_client
    test_client.close()
    app.dependency_overrides.clear()


@pytest.fixture
def sample_url():
    return "https://example.com"


@pytest.fixture
def sample_visit_dict():
    return {
        "url": "https://example.com",
        "link_count": 10,
        "word_count": 500,
        "image_count": 5
    }


@pytest.fixture
def sample_visit_schema():
    return schemas.PageVisitCreate(
        url="https://example.com",
        link_count=10,
        word_count=500,
        image_count=5
    )


def create_visit_dict(url="https://example.com", link_count=10, word_count=500, image_count=5):
    return {
        "url": url,
        "link_count": link_count,
        "word_count": word_count,
        "image_count": image_count
    }


def create_visit_schema(url="https://example.com", link_count=10, word_count=500, image_count=5):
    return schemas.PageVisitCreate(
        url=url,
        link_count=link_count,
        word_count=word_count,
        image_count=image_count
    )

