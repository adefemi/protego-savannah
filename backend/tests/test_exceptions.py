import pytest
from unittest.mock import Mock, patch
from sqlalchemy.exc import SQLAlchemyError
from fastapi import status
from app.exceptions import (
    BaseAPIException,
    DatabaseException,
    NotFoundException,
    ValidationException,
    base_api_exception_handler,
    sqlalchemy_exception_handler,
    general_exception_handler
)
from app import crud, schemas


class TestCustomExceptions:
    def test_base_api_exception_default(self):
        exc = BaseAPIException("Test error")
        assert exc.message == "Test error"
        assert exc.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR

    def test_base_api_exception_custom_status(self):
        exc = BaseAPIException("Test error", status.HTTP_400_BAD_REQUEST)
        assert exc.message == "Test error"
        assert exc.status_code == status.HTTP_400_BAD_REQUEST

    def test_database_exception(self):
        exc = DatabaseException()
        assert exc.message == "Database operation failed"
        assert exc.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR

    def test_database_exception_custom_message(self):
        exc = DatabaseException("Custom database error")
        assert exc.message == "Custom database error"
        assert exc.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR

    def test_not_found_exception(self):
        exc = NotFoundException()
        assert exc.message == "Resource not found"
        assert exc.status_code == status.HTTP_404_NOT_FOUND

    def test_not_found_exception_custom_message(self):
        exc = NotFoundException("User not found")
        assert exc.message == "User not found"
        assert exc.status_code == status.HTTP_404_NOT_FOUND

    def test_validation_exception(self):
        exc = ValidationException()
        assert exc.message == "Validation failed"
        assert exc.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestExceptionHandlers:
    @pytest.mark.asyncio
    async def test_base_api_exception_handler(self):
        request = Mock()
        request.url.path = "/test"
        
        exc = BaseAPIException("Test error", status.HTTP_400_BAD_REQUEST)
        response = await base_api_exception_handler(request, exc)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert b'"success":false' in response.body or b'"success": false' in response.body
        assert b'"error":"Test error"' in response.body or b'"error": "Test error"' in response.body

    @pytest.mark.asyncio
    async def test_sqlalchemy_exception_handler(self):
        request = Mock()
        request.url.path = "/test"
        
        exc = SQLAlchemyError("Database error")
        response = await sqlalchemy_exception_handler(request, exc)
        
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert b'"success":false' in response.body or b'"success": false' in response.body
        assert b"Database error occurred" in response.body

    @pytest.mark.asyncio
    async def test_general_exception_handler(self):
        request = Mock()
        request.url.path = "/test"
        
        exc = Exception("Unexpected error")
        response = await general_exception_handler(request, exc)
        
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert b'"success":false' in response.body or b'"success": false' in response.body
        assert b"An unexpected error occurred" in response.body


class TestCRUDErrorHandling:
    def test_create_page_visit_database_error(self, db):
        visit_data = schemas.PageVisitCreate(
            url="https://example.com",
            link_count=10,
            word_count=500,
            image_count=5
        )
        
        with patch.object(db, 'commit', side_effect=SQLAlchemyError("Database error")):
            with pytest.raises(DatabaseException) as exc_info:
                crud.create_page_visit(db, visit_data)
            
            assert "Failed to create page visit" in str(exc_info.value.message)

    def test_get_visits_by_url_database_error(self, db):
        with patch.object(db, 'query', side_effect=SQLAlchemyError("Query error")):
            with pytest.raises(DatabaseException) as exc_info:
                crud.get_visits_by_url(db, "https://example.com")
            
            assert "Failed to retrieve visits" in str(exc_info.value.message)

    def test_get_latest_metrics_database_error(self, db):
        with patch.object(db, 'query', side_effect=SQLAlchemyError("Query error")):
            with pytest.raises(DatabaseException) as exc_info:
                crud.get_latest_metrics(db, "https://example.com")
            
            assert "Failed to retrieve metrics" in str(exc_info.value.message)


class TestAPIErrorResponses:
    def test_create_visit_handles_database_error(self, client, db):
        visit_data = {
            "url": "https://example.com",
            "link_count": 10,
            "word_count": 500,
            "image_count": 5
        }
        
        with patch('app.crud.create_page_visit', side_effect=DatabaseException("DB Error")):
            response = client.post("/api/visits", json=visit_data)
            
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            data = response.json()
            assert data["success"] is False
            assert "DB Error" in data["error"]

    def test_get_visits_handles_database_error(self, client):
        with patch('app.crud.get_visits_by_url', side_effect=DatabaseException("Query failed")):
            response = client.get("/api/visits?url=https://example.com")
            
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            data = response.json()
            assert data["success"] is False
            assert "Query failed" in data["error"]

    def test_get_metrics_handles_database_error(self, client):
        with patch('app.crud.get_latest_metrics', side_effect=DatabaseException("Metrics error")):
            response = client.get("/api/metrics/current?url=https://example.com")
            
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            data = response.json()
            assert data["success"] is False
            assert "Metrics error" in data["error"]

    def test_unexpected_exception_caught_by_global_handler(self, client):
        with patch('app.services.PageVisitService.get_latest_metrics', side_effect=Exception("Unexpected error")):
            response = client.get("/api/metrics/current?url=https://example.com")
            
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            data = response.json()
            assert data["success"] is False
            assert "An unexpected error occurred" in data["error"]
            assert "path" in data

    def test_unexpected_exception_in_create(self, client):
        visit_data = {
            "url": "https://example.com",
            "link_count": 10,
            "word_count": 500,
            "image_count": 5
        }
        
        with patch('app.services.PageVisitService.create_visit', side_effect=RuntimeError("Random runtime error")):
            response = client.post("/api/visits", json=visit_data)
            
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            data = response.json()
            assert data["success"] is False
            assert "An unexpected error occurred" in data["error"]

