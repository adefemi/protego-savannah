import time
from datetime import datetime
from app import crud, schemas


class TestCreatePageVisit:
    def test_create_page_visit_success(self, db):
        visit_data = schemas.PageVisitCreate(
            url="https://example.com",
            link_count=10,
            word_count=500,
            image_count=5
        )
        
        result = crud.create_page_visit(db, visit_data)
        
        assert result.id is not None
        assert result.url == "https://example.com"
        assert result.link_count == 10
        assert result.word_count == 500
        assert result.image_count == 5
        assert isinstance(result.datetime_visited, datetime)

    def test_create_page_visit_with_zero_counts(self, db):
        visit_data = schemas.PageVisitCreate(
            url="https://empty-page.com",
            link_count=0,
            word_count=0,
            image_count=0
        )
        
        result = crud.create_page_visit(db, visit_data)
        
        assert result.link_count == 0
        assert result.word_count == 0
        assert result.image_count == 0

    def test_create_multiple_visits_same_url(self, db):
        visit_data = schemas.PageVisitCreate(
            url="https://example.com",
            link_count=10,
            word_count=500,
            image_count=5
        )
        
        result1 = crud.create_page_visit(db, visit_data)
        result2 = crud.create_page_visit(db, visit_data)
        
        assert result1.id != result2.id
        assert result1.url == result2.url


class TestGetVisitsByUrl:
    def test_get_visits_by_url_single_visit(self, db):
        visit_data = schemas.PageVisitCreate(
            url="https://example.com",
            link_count=10,
            word_count=500,
            image_count=5
        )
        crud.create_page_visit(db, visit_data)
        
        visits = crud.get_visits_by_url(db, "https://example.com")
        
        assert len(visits) == 1
        assert visits[0].url == "https://example.com"
        assert visits[0].link_count == 10
        assert visits[0].word_count == 500
        assert visits[0].image_count == 5

    def test_get_visits_by_url_multiple_visits(self, db):
        url = "https://example.com"
        
        for i in range(3):
            visit_data = schemas.PageVisitCreate(
                url=url,
                link_count=10 + i,
                word_count=500 + i,
                image_count=5 + i
            )
            crud.create_page_visit(db, visit_data)
            time.sleep(0.01)
        
        visits = crud.get_visits_by_url(db, url)
        
        assert len(visits) == 3
        assert visits[0].link_count == 12
        assert visits[1].link_count == 11
        assert visits[2].link_count == 10

    def test_get_visits_by_url_no_visits(self, db):
        visits = crud.get_visits_by_url(db, "https://nonexistent.com")
        
        assert len(visits) == 0

    def test_get_visits_by_url_different_urls(self, db):
        visit1 = schemas.PageVisitCreate(
            url="https://example1.com",
            link_count=10,
            word_count=500,
            image_count=5
        )
        visit2 = schemas.PageVisitCreate(
            url="https://example2.com",
            link_count=20,
            word_count=600,
            image_count=6
        )
        
        crud.create_page_visit(db, visit1)
        crud.create_page_visit(db, visit2)
        
        visits1 = crud.get_visits_by_url(db, "https://example1.com")
        visits2 = crud.get_visits_by_url(db, "https://example2.com")
        
        assert len(visits1) == 1
        assert len(visits2) == 1
        assert visits1[0].link_count == 10
        assert visits2[0].link_count == 20

    def test_get_visits_by_url_respects_limit(self, db):
        url = "https://example.com"
        
        for i in range(60):
            visit_data = schemas.PageVisitCreate(
                url=url,
                link_count=i,
                word_count=i * 10,
                image_count=i
            )
            crud.create_page_visit(db, visit_data)
        
        visits = crud.get_visits_by_url(db, url, limit=50)
        
        assert len(visits) == 50


class TestGetLatestMetrics:
    def test_get_latest_metrics_single_visit(self, db):
        visit_data = schemas.PageVisitCreate(
            url="https://example.com",
            link_count=10,
            word_count=500,
            image_count=5
        )
        crud.create_page_visit(db, visit_data)
        
        latest = crud.get_latest_metrics(db, "https://example.com")
        
        assert latest is not None
        assert latest.link_count == 10
        assert latest.word_count == 500
        assert latest.image_count == 5

    def test_get_latest_metrics_multiple_visits_returns_most_recent(self, db):
        url = "https://example.com"
        
        visit1 = schemas.PageVisitCreate(
            url=url,
            link_count=10,
            word_count=500,
            image_count=5
        )
        visit2 = schemas.PageVisitCreate(
            url=url,
            link_count=20,
            word_count=600,
            image_count=10
        )
        
        crud.create_page_visit(db, visit1)
        time.sleep(0.01)
        crud.create_page_visit(db, visit2)
        
        latest = crud.get_latest_metrics(db, url)
        
        assert latest.link_count == 20
        assert latest.word_count == 600
        assert latest.image_count == 10

    def test_get_latest_metrics_no_visits(self, db):
        latest = crud.get_latest_metrics(db, "https://nonexistent.com")
        
        assert latest is None

    def test_get_latest_metrics_different_urls(self, db):
        visit1 = schemas.PageVisitCreate(
            url="https://example1.com",
            link_count=10,
            word_count=500,
            image_count=5
        )
        visit2 = schemas.PageVisitCreate(
            url="https://example2.com",
            link_count=20,
            word_count=600,
            image_count=6
        )
        
        crud.create_page_visit(db, visit1)
        crud.create_page_visit(db, visit2)
        
        latest1 = crud.get_latest_metrics(db, "https://example1.com")
        latest2 = crud.get_latest_metrics(db, "https://example2.com")
        
        assert latest1.link_count == 10
        assert latest2.link_count == 20


class TestDataIntegrity:
    def test_url_with_special_characters(self, db):
        visit_data = schemas.PageVisitCreate(
            url="https://example.com/path?query=value&foo=bar#section",
            link_count=10,
            word_count=500,
            image_count=5
        )
        
        result = crud.create_page_visit(db, visit_data)
        visits = crud.get_visits_by_url(db, "https://example.com/path?query=value&foo=bar#section")
        
        assert len(visits) == 1
        assert visits[0].url == "https://example.com/path?query=value&foo=bar#section"

    def test_large_counts(self, db):
        visit_data = schemas.PageVisitCreate(
            url="https://example.com",
            link_count=10000,
            word_count=500000,
            image_count=5000
        )
        
        result = crud.create_page_visit(db, visit_data)
        
        assert result.link_count == 10000
        assert result.word_count == 500000
        assert result.image_count == 5000

    def test_very_long_url(self, db):
        long_url = "https://example.com/" + "a" * 1000
        visit_data = schemas.PageVisitCreate(
            url=long_url,
            link_count=10,
            word_count=500,
            image_count=5
        )
        
        result = crud.create_page_visit(db, visit_data)
        visits = crud.get_visits_by_url(db, long_url)
        
        assert len(visits) == 1
        assert visits[0].url == long_url

