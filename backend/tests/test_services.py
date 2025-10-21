import pytest
from unittest.mock import Mock, patch
from app.services import PageVisitService
from app.exceptions import ValidationException, DatabaseException
from app import schemas
from .conftest import create_visit_schema


class TestPageVisitServiceCreate:
    def test_create_visit_success(self, db, sample_visit_schema):
        result = PageVisitService.create_visit(db, sample_visit_schema)
        
        assert result.url == sample_visit_schema.url
        assert result.link_count == sample_visit_schema.link_count
        assert result.word_count == sample_visit_schema.word_count
        assert result.image_count == sample_visit_schema.image_count
        assert result.id is not None
        assert result.datetime_visited is not None

    def test_create_visit_with_zero_counts(self, db):
        visit_data = create_visit_schema(link_count=0, word_count=0, image_count=0)
        result = PageVisitService.create_visit(db, visit_data)
        
        assert result.link_count == 0
        assert result.word_count == 0
        assert result.image_count == 0

    def test_create_visit_empty_url(self, db):
        visit_data = create_visit_schema(url="")
        
        with pytest.raises(ValidationException) as exc_info:
            PageVisitService.create_visit(db, visit_data)
        
        assert "URL cannot be empty" in str(exc_info.value.message)

    def test_create_visit_whitespace_url(self, db):
        visit_data = create_visit_schema(url="   ")
        
        with pytest.raises(ValidationException) as exc_info:
            PageVisitService.create_visit(db, visit_data)
        
        assert "URL cannot be empty" in str(exc_info.value.message)

    def test_create_visit_negative_link_count(self, db):
        visit_data = create_visit_schema(link_count=-1)
        
        with pytest.raises(ValidationException) as exc_info:
            PageVisitService.create_visit(db, visit_data)
        
        assert "Counts cannot be negative" in str(exc_info.value.message)

    def test_create_visit_negative_word_count(self, db):
        visit_data = create_visit_schema(word_count=-500)
        
        with pytest.raises(ValidationException) as exc_info:
            PageVisitService.create_visit(db, visit_data)
        
        assert "Counts cannot be negative" in str(exc_info.value.message)

    def test_create_visit_negative_image_count(self, db):
        visit_data = create_visit_schema(image_count=-5)
        
        with pytest.raises(ValidationException) as exc_info:
            PageVisitService.create_visit(db, visit_data)
        
        assert "Counts cannot be negative" in str(exc_info.value.message)

    def test_create_visit_database_error(self, db):
        visit_data = create_visit_schema()
        
        with patch('app.crud.create_page_visit', side_effect=DatabaseException("DB Error")):
            with pytest.raises(DatabaseException):
                PageVisitService.create_visit(db, visit_data)


class TestPageVisitServiceGetVisits:
    def test_get_visits_success(self, db, sample_url):
        visit_data = create_visit_schema(url=sample_url)
        PageVisitService.create_visit(db, visit_data)
        
        visits = PageVisitService.get_visits_by_url(db, sample_url)
        
        assert len(visits) == 1
        assert visits[0].url == sample_url
        assert visits[0].link_count == 10

    def test_get_visits_multiple(self, db, sample_url):
        for i in range(3):
            visit_data = create_visit_schema(url=sample_url, link_count=10 + i, word_count=500 + i, image_count=5 + i)
            PageVisitService.create_visit(db, visit_data)
        
        visits = PageVisitService.get_visits_by_url(db, sample_url)
        
        assert len(visits) == 3
        assert visits[0].link_count == 12
        assert visits[1].link_count == 11
        assert visits[2].link_count == 10

    def test_get_visits_empty_url(self, db):
        with pytest.raises(ValidationException) as exc_info:
            PageVisitService.get_visits_by_url(db, "")
        
        assert "URL cannot be empty" in str(exc_info.value.message)

    def test_get_visits_whitespace_url(self, db):
        with pytest.raises(ValidationException) as exc_info:
            PageVisitService.get_visits_by_url(db, "   ")
        
        assert "URL cannot be empty" in str(exc_info.value.message)

    def test_get_visits_custom_limit(self, db, sample_url):
        for i in range(10):
            visit_data = create_visit_schema(url=sample_url, link_count=i, word_count=i * 10, image_count=i)
            PageVisitService.create_visit(db, visit_data)
        
        visits = PageVisitService.get_visits_by_url(db, sample_url, limit=5)
        
        assert len(visits) == 5

    def test_get_visits_limit_too_low(self, db, sample_url):
        with pytest.raises(ValidationException) as exc_info:
            PageVisitService.get_visits_by_url(db, sample_url, limit=0)
        
        assert "Limit must be between 1 and 100" in str(exc_info.value.message)

    def test_get_visits_limit_too_high(self, db, sample_url):
        with pytest.raises(ValidationException) as exc_info:
            PageVisitService.get_visits_by_url(db, sample_url, limit=101)
        
        assert "Limit must be between 1 and 100" in str(exc_info.value.message)

    def test_get_visits_no_results(self, db):
        visits = PageVisitService.get_visits_by_url(db, "https://nonexistent.com")
        
        assert len(visits) == 0

    def test_get_visits_database_error(self, db, sample_url):
        with patch('app.crud.get_visits_by_url', side_effect=DatabaseException("Query failed")):
            with pytest.raises(DatabaseException):
                PageVisitService.get_visits_by_url(db, sample_url)


class TestPageVisitServiceGetMetrics:
    def test_get_metrics_success(self, db, sample_url):
        visit_data = create_visit_schema(url=sample_url)
        PageVisitService.create_visit(db, visit_data)
        
        metrics = PageVisitService.get_latest_metrics(db, sample_url)
        
        assert metrics.link_count == 10
        assert metrics.word_count == 500
        assert metrics.image_count == 5
        assert metrics.last_visited is not None

    def test_get_metrics_returns_latest(self, db, sample_url):
        visit1 = create_visit_schema(url=sample_url, link_count=10, word_count=500, image_count=5)
        visit2 = create_visit_schema(url=sample_url, link_count=20, word_count=600, image_count=10)
        
        PageVisitService.create_visit(db, visit1)
        PageVisitService.create_visit(db, visit2)
        
        metrics = PageVisitService.get_latest_metrics(db, sample_url)
        
        assert metrics.link_count == 20
        assert metrics.word_count == 600
        assert metrics.image_count == 10

    def test_get_metrics_no_data(self, db):
        metrics = PageVisitService.get_latest_metrics(db, "https://nonexistent.com")
        
        assert metrics.link_count == 0
        assert metrics.word_count == 0
        assert metrics.image_count == 0
        assert metrics.last_visited is None

    def test_get_metrics_empty_url(self, db):
        with pytest.raises(ValidationException) as exc_info:
            PageVisitService.get_latest_metrics(db, "")
        
        assert "URL cannot be empty" in str(exc_info.value.message)

    def test_get_metrics_whitespace_url(self, db):
        with pytest.raises(ValidationException) as exc_info:
            PageVisitService.get_latest_metrics(db, "   ")
        
        assert "URL cannot be empty" in str(exc_info.value.message)

    def test_get_metrics_database_error(self, db, sample_url):
        with patch('app.crud.get_latest_metrics', side_effect=DatabaseException("Metrics error")):
            with pytest.raises(DatabaseException):
                PageVisitService.get_latest_metrics(db, sample_url)


class TestServiceIntegration:
    def test_full_workflow_with_service_layer(self, db, sample_url):
        visit_data = create_visit_schema(url=sample_url)
        
        created = PageVisitService.create_visit(db, visit_data)
        assert created.id is not None
        
        visits = PageVisitService.get_visits_by_url(db, sample_url)
        assert len(visits) == 1
        assert visits[0].id == created.id
        
        metrics = PageVisitService.get_latest_metrics(db, sample_url)
        assert metrics.link_count == 10
        assert metrics.word_count == 500
        assert metrics.image_count == 5

    def test_multiple_pages_isolation(self, db):
        url1 = "https://example1.com"
        url2 = "https://example2.com"
        
        visit1 = create_visit_schema(url=url1, link_count=10, word_count=500, image_count=5)
        visit2 = create_visit_schema(url=url2, link_count=20, word_count=600, image_count=10)
        
        PageVisitService.create_visit(db, visit1)
        PageVisitService.create_visit(db, visit2)
        
        visits1 = PageVisitService.get_visits_by_url(db, url1)
        visits2 = PageVisitService.get_visits_by_url(db, url2)
        
        assert len(visits1) == 1
        assert len(visits2) == 1
        assert visits1[0].link_count == 10
        assert visits2[0].link_count == 20

