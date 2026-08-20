from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_dashboard_overview():
    response = client.get("/api/v1/dashboard/overview")
    assert response.status_code == 200
    data = response.json()
    assert "healthScore" in data
    assert "status" in data

def test_dashboard_fields():
    response = client.get("/api/v1/dashboard/fields")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "id" in data[0]
    assert "crop" in data[0]

def test_ndvi_history():
    response = client.get("/api/v1/dashboard/ndvi-history")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "date" in data[0]
    assert "value" in data[0]

def test_moisture_history():
    response = client.get("/api/v1/dashboard/moisture-history")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "date" in data[0]
    assert "value" in data[0]

def test_recent_scans():
    response = client.get("/api/v1/dashboard/recent-scans")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_recommendations():
    response = client.get("/api/v1/dashboard/recommendations")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_carbon_metrics():
    response = client.get("/api/v1/dashboard/carbon-metrics")
    assert response.status_code == 200
    data = response.json()
    assert "soc" in data
    assert "carbonCredits" in data
