import logging
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.schemas.advisory import AdvisoryRequest, AdvisoryResponse
from app.services.gemini_service import GeminiService
from app.services.firestore_service import FirestoreService
from app.services.weather_service import WeatherService

logger = logging.getLogger("TerraPulseBackend.Advisory")
router = APIRouter(prefix="/advisory", tags=["Advisory"])

def get_aggregated_context(field_id: str) -> dict:
    # 1. Fetch Field details
    field = FirestoreService.get_field(field_id) or {
        "id": field_id,
        "fieldName": "West Field",
        "crop": "Cotton",
        "cropStage": "Flowering",
        "acres": 12.0,
        "soilType": "Black Clay",
        "ndvi": 0.54,
        "ndviTrend": "Decreasing",
        "moisture": 28.0,
        "temperature": 34.0,
        "location": "Pune, Maharashtra"
    }
    
    # 2. Add weather & forecast context using live location
    weather = WeatherService.get_live_weather(field.get("location", "Pune, Maharashtra"))
    field["temperature"] = weather["temp"]
    field["moisture"] = weather["moisture"]
    field["rainfall"] = weather["rainfall"]
    field["forecast"] = weather["forecast"]
    
    # 3. Add disease scan history context
    recent_scans = FirestoreService.get_recent_scans()
    field_scans = [s for s in recent_scans if s.get("fieldId") == field_id]
    if field_scans:
        field["diseases"] = ", ".join([s.get("diagnosis", "") for s in field_scans if s.get("diagnosis")])
    else:
        field["diseases"] = "None"
        
    # 4. Add previous recommendations & farmer actions
    actions = FirestoreService.get_actions()
    field_actions = [a for a in actions if a.get("field_id") == field_id]
    completed_actions = [a for a in field_actions if a.get("status") == "COMPLETED"]
    pending_actions = [a for a in field_actions if a.get("status") == "PENDING"]
    
    field["prevRecs"] = ", ".join([a.get("title", "") for a in pending_actions]) or "Improve irrigation frequency"
    field["recentActions"] = ", ".join([a.get("title", "") for a in completed_actions]) or "None"
    field["field_id"] = field_id
    
    return field

@router.post("", response_model=AdvisoryResponse)
async def generate_general_advisory(request: AdvisoryRequest):
    # Fetch live weather for general advisory location
    weather = WeatherService.get_live_weather(request.location)
    context = {
        "field_id": request.field_id,
        "fieldName": "West Field",
        "crop": request.crop,
        "cropStage": request.crop_stage,
        "acres": 12.0,
        "soilType": "Black Clay",
        "ndvi": request.ndvi,
        "ndviTrend": "Decreasing",
        "moisture": weather["moisture"],
        "temperature": weather["temp"],
        "location": request.location,
        "rainfall": weather["rainfall"],
        "forecast": weather["forecast"],
        "diseases": request.diseases,
        "prevRecs": "Improve irrigation frequency",
        "recentActions": "None"
    }
    
    return GeminiService.generate_advisory(context)

@router.post("/{field_id}", response_model=AdvisoryResponse)
async def generate_field_advisory(field_id: str):
    try:
        context = get_aggregated_context(field_id)
        return GeminiService.generate_advisory(context)
    except Exception as e:
        logger.error(f"Failed to generate field advisory: {e}")
        raise HTTPException(status_code=500, detail=str(e))
