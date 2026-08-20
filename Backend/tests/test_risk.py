from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_calculate_risk():
    payload = {
        "ndvi": 0.54,
        "ndvi_change": -19.4,
        "moisture": 28.0,
        "temperature": 34.0,
        "rainfall": 8.0,
        "crop": "Cotton",
        "crop_stage": "Flowering",
        "soil_type": "Black Clay",
        "diseases": "None"
    }
    response = client.post("/api/v1/risk", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "riskScore" in data
    assert "riskStatus" in data
    assert data["riskStatus"] == "MEDIUM"  # Deterministic score logic expects ~59.1

def test_calculate_risk_malformed():
    payload = {
        "ndvi": "invalid_value",
        "ndvi_change": -19.4
    }
    response = client.post("/api/v1/risk", json=payload)
    assert response.status_code == 422
