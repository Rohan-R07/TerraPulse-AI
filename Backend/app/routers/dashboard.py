from fastapi import APIRouter
from app.services.earth_engine_service import EarthEngineService
from app.services.firestore_service import FirestoreService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/overview")
async def get_overview():
    sat = EarthEngineService.get_satellite_data("west-field", "demo")
    return {
        "healthScore": int(sat["ndvi"] * 100),
        "status": sat["status"],
        "healthTrend": "Decreasing" if sat["ndvi"] < 0.6 else "Stable",
        "dataSource": sat["dataSource"]
    }

@router.get("/fields")
async def get_fields():
    return FirestoreService.get_fields()

@router.get("/ndvi-history")
async def get_ndvi_history():
    return EarthEngineService.get_historical_ndvi("west-field")

@router.get("/moisture-history")
async def get_moisture_history():
    return EarthEngineService.get_historical_moisture("west-field")

@router.get("/recent-scans")
async def get_recent_scans():
    return [
        { "id": "scan-1", "crop": "Cotton", "disease": "Cotton Leaf Curl Disease", "date": "2026-08-19", "severity": "High" },
        { "id": "scan-2", "crop": "Wheat", "disease": "Healthy", "date": "2026-08-18", "severity": "Low" }
    ]

@router.get("/recommendations")
async def get_recommendations():
    actions = FirestoreService.get_actions()
    return [
        {
            "id": act["id"],
            "title": act["recommendation"],
            "priority": act["priority"],
            "due": act["dueDate"]
        } for act in actions if act.get("status") == "PENDING"
    ]

@router.get("/carbon-metrics")
async def get_carbon_metrics():
    return {
        "soc": 1.4,
        "carbonCredits": 42.0,
        "waterSaved": 22
    }
