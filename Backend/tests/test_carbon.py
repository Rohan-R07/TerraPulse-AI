from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_carbon_simulator():
    payload = {
        "soilType": "clay-loam",
        "acreage": 12.0,
        "historicalYield": 2.5,
        "rotationA": ["cotton", "soybeans", "fallow"],
        "rotationB": ["cover-crop", "soybeans", "wheat"],
        "rotationC": ["cover-crop", "sunnhemp", "wheat"]
    }
    response = client.post("/api/v1/simulator/carbon", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "scenarioA" in data
    assert "scenarioB" in data
    assert "scenarioC" in data
    assert "strategyAnalysis" in data
    assert data["scenarioB"]["socProjected"] > data["scenarioA"]["socProjected"]
