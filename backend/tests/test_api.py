from fastapi import status
from urllib.parse import quote
from .conftest import create_visit_dict


class TestRootEndpoint:
    def test_root_endpoint(self, client):
        response = client.get("/")
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["message"] == "Protego History API"
        assert response.json()["status"] == "running"


class TestHealthEndpoint:
    def test_health_endpoint(self, client):
        response = client.get("/health")
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "healthy"


class TestCreateVisitEndpoint:
    def test_create_visit_success(self, client, sample_visit_dict):
        response = client.post("/api/visits", json=sample_visit_dict)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["url"] == sample_visit_dict["url"]
        assert data["link_count"] == sample_visit_dict["link_count"]
        assert data["word_count"] == sample_visit_dict["word_count"]
        assert data["image_count"] == sample_visit_dict["image_count"]
        assert "id" in data
        assert "datetime_visited" in data

    def test_create_visit_with_zero_counts(self, client):
        visit_data = create_visit_dict(link_count=0, word_count=0, image_count=0)
        response = client.post("/api/visits", json=visit_data)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["link_count"] == 0
        assert data["word_count"] == 0
        assert data["image_count"] == 0

    def test_create_visit_missing_fields(self, client):
        visit_data = {"url": "https://example.com", "link_count": 10}
        response = client.post("/api/visits", json=visit_data)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_visit_invalid_data_types(self, client):
        visit_data = create_visit_dict(link_count="invalid")
        response = client.post("/api/visits", json=visit_data)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_visit_negative_counts(self, client):
        visit_data = create_visit_dict(link_count=-10)
        response = client.post("/api/visits", json=visit_data)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        data = response.json()
        assert data["success"] is False
        assert "Counts cannot be negative" in data["error"]


class TestGetVisitsEndpoint:
    def test_get_visits_with_data(self, client, sample_visit_dict, sample_url):
        client.post("/api/visits", json=sample_visit_dict)
        
        response = client.get(f"/api/visits?url={sample_url}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["url"] == sample_url
        assert data[0]["link_count"] == 10

    def test_get_visits_multiple_visits(self, client, sample_url):
        for i in range(3):
            visit_data = create_visit_dict(url=sample_url, link_count=10 + i, word_count=500 + i, image_count=5 + i)
            client.post("/api/visits", json=visit_data)
        
        response = client.get(f"/api/visits?url={sample_url}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 3
        assert data[0]["link_count"] == 12
        assert data[1]["link_count"] == 11
        assert data[2]["link_count"] == 10

    def test_get_visits_no_data(self, client):
        response = client.get("/api/visits?url=https://nonexistent.com")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_get_visits_missing_url_parameter(self, client):
        response = client.get("/api/visits")
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_get_visits_url_with_special_characters(self, client):
        url = "https://example.com/path?query=value&foo=bar#section"
        visit_data = create_visit_dict(url=url)
        client.post("/api/visits", json=visit_data)
        
        encoded_url = quote(url, safe='')
        response = client.get(f"/api/visits?url={encoded_url}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1


class TestGetCurrentMetricsEndpoint:
    def test_get_metrics_with_data(self, client, sample_visit_dict, sample_url):
        client.post("/api/visits", json=sample_visit_dict)
        
        response = client.get(f"/api/metrics/current?url={sample_url}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["link_count"] == 10
        assert data["word_count"] == 500
        assert data["image_count"] == 5
        assert data["last_visited"] is not None

    def test_get_metrics_returns_latest(self, client, sample_url):
        visit1 = create_visit_dict(url=sample_url, link_count=10, word_count=500, image_count=5)
        visit2 = create_visit_dict(url=sample_url, link_count=20, word_count=600, image_count=10)
        
        client.post("/api/visits", json=visit1)
        client.post("/api/visits", json=visit2)
        
        response = client.get(f"/api/metrics/current?url={sample_url}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["link_count"] == 20
        assert data["word_count"] == 600
        assert data["image_count"] == 10

    def test_get_metrics_no_data(self, client):
        response = client.get("/api/metrics/current?url=https://nonexistent.com")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["link_count"] == 0
        assert data["word_count"] == 0
        assert data["image_count"] == 0
        assert data["last_visited"] is None

    def test_get_metrics_missing_url_parameter(self, client):
        response = client.get("/api/metrics/current")
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestEndToEndScenarios:
    def test_full_workflow_single_page(self, client, sample_url):
        visit_data = create_visit_dict(url=sample_url)
        
        create_response = client.post("/api/visits", json=visit_data)
        assert create_response.status_code == status.HTTP_200_OK
        
        visits_response = client.get(f"/api/visits?url={sample_url}")
        assert visits_response.status_code == status.HTTP_200_OK
        assert len(visits_response.json()) == 1
        
        metrics_response = client.get(f"/api/metrics/current?url={sample_url}")
        assert metrics_response.status_code == status.HTTP_200_OK
        metrics = metrics_response.json()
        assert metrics["link_count"] == 10
        assert metrics["word_count"] == 500
        assert metrics["image_count"] == 5

    def test_full_workflow_multiple_visits(self, client, sample_url):
        for i in range(3):
            visit_data = create_visit_dict(url=sample_url, link_count=10 + i, word_count=500 + (i * 10), image_count=5 + i)
            response = client.post("/api/visits", json=visit_data)
            assert response.status_code == status.HTTP_200_OK
        
        visits_response = client.get(f"/api/visits?url={sample_url}")
        visits = visits_response.json()
        assert len(visits) == 3
        
        metrics_response = client.get(f"/api/metrics/current?url={sample_url}")
        metrics = metrics_response.json()
        assert metrics["link_count"] == 12
        assert metrics["word_count"] == 520
        assert metrics["image_count"] == 7

    def test_multiple_different_pages(self, client):
        pages = [
            create_visit_dict("https://example1.com", 10, 500, 5),
            create_visit_dict("https://example2.com", 20, 600, 10),
            create_visit_dict("https://example3.com", 30, 700, 15),
        ]
        
        for page in pages:
            response = client.post("/api/visits", json=page)
            assert response.status_code == status.HTTP_200_OK
        
        for page in pages:
            visits_response = client.get(f"/api/visits?url={page['url']}")
            assert len(visits_response.json()) == 1
            
            metrics_response = client.get(f"/api/metrics/current?url={page['url']}")
            metrics = metrics_response.json()
            assert metrics["link_count"] == page["link_count"]
            assert metrics["word_count"] == page["word_count"]
            assert metrics["image_count"] == page["image_count"]


class TestCORSHeaders:
    def test_cors_headers_present(self, client):
        response = client.options("/api/visits", headers={
            "Origin": "chrome-extension://test",
            "Access-Control-Request-Method": "POST"
        })
        
        assert "access-control-allow-origin" in response.headers

