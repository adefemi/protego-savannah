"""
Tests for new features: pagination, bulk operations, and delete functionality
"""

import pytest
from app import schemas


class TestPaginatedEndpoint:
    """Test paginated visits endpoint"""
    
    def test_get_visits_paginated_first_page(self, client, db):
        """Test fetching first page of visits"""
        url = "https://example.com/"
        
        # Create 10 visits
        for i in range(10):
            visit_data = {
                "url": url,
                "link_count": i,
                "word_count": i * 10,
                "image_count": i * 2
            }
            client.post("/api/visits", json=visit_data)
        
        # Get first page (5 items)
        response = client.get(f"/api/visits/paginated?url={url}&page=1&page_size=5")
        assert response.status_code == 200
        
        data = response.json()
        assert "data" in data
        assert "meta" in data
        assert len(data["data"]) == 5
        assert data["meta"]["total"] == 10
        assert data["meta"]["page"] == 1
        assert data["meta"]["page_size"] == 5
        assert data["meta"]["total_pages"] == 2
        assert data["meta"]["has_next"] is True
        assert data["meta"]["has_prev"] is False
    
    def test_get_visits_paginated_second_page(self, client, db):
        """Test fetching second page of visits"""
        url = "https://example.com/"
        
        # Create 10 visits
        for i in range(10):
            visit_data = {
                "url": url,
                "link_count": i,
                "word_count": i * 10,
                "image_count": i * 2
            }
            client.post("/api/visits", json=visit_data)
        
        # Get second page
        response = client.get(f"/api/visits/paginated?url={url}&page=2&page_size=5")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["data"]) == 5
        assert data["meta"]["page"] == 2
        assert data["meta"]["has_next"] is False
        assert data["meta"]["has_prev"] is True
    
    def test_get_visits_paginated_invalid_page(self, client):
        """Test that invalid page number returns error"""
        response = client.get("/api/visits/paginated?url=https://example.com&page=0&page_size=10")
        assert response.status_code == 422
    
    def test_get_visits_paginated_invalid_page_size(self, client):
        """Test that invalid page size returns error"""
        response = client.get("/api/visits/paginated?url=https://example.com&page=1&page_size=200")
        assert response.status_code == 422
    
    def test_get_visits_paginated_empty_results(self, client, db):
        """Test paginated endpoint with no results"""
        response = client.get("/api/visits/paginated?url=https://nonexistent.com&page=1&page_size=10")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["data"]) == 0
        assert data["meta"]["total"] == 0
        assert data["meta"]["total_pages"] == 0


class TestBulkOperations:
    """Test bulk operations"""
    
    def test_create_visits_bulk_success(self, client, db):
        """Test creating multiple visits at once"""
        bulk_data = {
            "visits": [
                {
                    "url": "https://example.com",
                    "link_count": 5,
                    "word_count": 100,
                    "image_count": 3
                },
                {
                    "url": "https://example.org",
                    "link_count": 10,
                    "word_count": 200,
                    "image_count": 5
                },
                {
                    "url": "https://test.com",
                    "link_count": 15,
                    "word_count": 300,
                    "image_count": 7
                }
            ]
        }
        
        response = client.post("/api/visits/bulk", json=bulk_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["created"] == 3
        assert data["failed"] == 0
        assert len(data["results"]) == 3
    
    def test_create_visits_bulk_with_failures(self, client, db):
        """Test bulk create with some invalid visits"""
        bulk_data = {
            "visits": [
                {
                    "url": "https://example.com",
                    "link_count": 5,
                    "word_count": 100,
                    "image_count": 3
                },
                {
                    "url": "",  # Invalid URL
                    "link_count": 10,
                    "word_count": 200,
                    "image_count": 5
                },
                {
                    "url": "https://test.com",
                    "link_count": -5,  # Invalid count
                    "word_count": 300,
                    "image_count": 7
                }
            ]
        }
        
        response = client.post("/api/visits/bulk", json=bulk_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["created"] == 1
        assert data["failed"] == 2
        assert len(data["results"]) == 1
    
    def test_create_visits_bulk_empty(self, client):
        """Test bulk create with empty list"""
        bulk_data = {"visits": []}
        
        response = client.post("/api/visits/bulk", json=bulk_data)
        assert response.status_code == 422
    
    def test_create_visits_bulk_too_many(self, client):
        """Test bulk create with too many visits"""
        bulk_data = {
            "visits": [
                {
                    "url": f"https://example{i}.com",
                    "link_count": 5,
                    "word_count": 100,
                    "image_count": 3
                }
                for i in range(101)
            ]
        }
        
        response = client.post("/api/visits/bulk", json=bulk_data)
        assert response.status_code == 422


class TestDeleteEndpoint:
    """Test delete functionality"""
    
    def test_delete_visits_success(self, client, db):
        """Test deleting visits for a URL"""
        url = "https://example.com/"
        
        # Create some visits
        for i in range(5):
            visit_data = {
                "url": url,
                "link_count": i,
                "word_count": i * 10,
                "image_count": i * 2
            }
            client.post("/api/visits", json=visit_data)
        
        # Delete them
        response = client.delete(f"/api/visits?url={url}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["deleted"] == 5
        assert data["url"] == url
        
        # Verify they're gone
        get_response = client.get(f"/api/visits?url={url}")
        assert get_response.status_code == 200
        assert len(get_response.json()) == 0
    
    def test_delete_visits_nonexistent(self, client, db):
        """Test deleting visits that don't exist"""
        response = client.delete("/api/visits?url=https://nonexistent.com")
        assert response.status_code == 200
        
        data = response.json()
        assert data["deleted"] == 0
    
    def test_delete_visits_invalid_url(self, client):
        """Test delete with invalid URL"""
        response = client.delete("/api/visits?url=invalid-url")
        assert response.status_code == 422
    
    def test_delete_only_specific_url(self, client, db):
        """Test that delete only affects specified URL"""
        url1 = "https://example.com/"
        url2 = "https://different.com/"
        
        # Create visits for both URLs
        for i in range(3):
            client.post("/api/visits", json={
                "url": url1,
                "link_count": i,
                "word_count": i * 10,
                "image_count": i * 2
            })
            client.post("/api/visits", json={
                "url": url2,
                "link_count": i,
                "word_count": i * 10,
                "image_count": i * 2
            })
        
        # Delete only url1
        response = client.delete(f"/api/visits?url={url1}")
        assert response.status_code == 200
        assert response.json()["deleted"] == 3
        
        # Verify url2 visits still exist
        get_response = client.get(f"/api/visits?url={url2}")
        assert len(get_response.json()) == 3


class TestIntegration:
    """Integration tests for new features"""
    
    def test_full_workflow_with_pagination(self, client, db):
        """Test complete workflow with pagination"""
        url = "https://workflow.test/"
        
        # Bulk create visits
        bulk_data = {
            "visits": [
                {
                    "url": url,
                    "link_count": i,
                    "word_count": i * 10,
                    "image_count": i * 2
                }
                for i in range(15)
            ]
        }
        
        bulk_response = client.post("/api/visits/bulk", json=bulk_data)
        assert bulk_response.json()["created"] == 15
        
        # Get paginated results
        page1 = client.get(f"/api/visits/paginated?url={url}&page=1&page_size=10")
        assert len(page1.json()["data"]) == 10
        assert page1.json()["meta"]["total"] == 15
        
        page2 = client.get(f"/api/visits/paginated?url={url}&page=2&page_size=10")
        assert len(page2.json()["data"]) == 5
        
        # Delete all
        delete_response = client.delete(f"/api/visits?url={url}")
        assert delete_response.json()["deleted"] == 15
        
        # Verify empty
        final_response = client.get(f"/api/visits/paginated?url={url}&page=1&page_size=10")
        assert len(final_response.json()["data"]) == 0

