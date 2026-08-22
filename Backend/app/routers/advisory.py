import logging
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from app.schemas.advisory import AdvisoryRequest, AdvisoryResponse
from app.services.gemini_service import GeminiService
from app.services.firestore_service import FirestoreService
from app.services.weather_service import WeatherService

logger = logging.getLogger("TerraPulseBackend.Advisory")
router = APIRouter(prefix="/advisory", tags=["Advisory"])

def get_aggregated_context(field_id: str) -> dict:
    # 1. Fetch Field details from store
    # Normalize ID to match store structure
    norm_id = "north"
    for fid in ["north", "south", "east", "west"]:
        if fid in field_id.lower():
            norm_id = fid
            break

    field = FirestoreService.get_field(norm_id)
    if not field:
        clean_name = norm_id.capitalize()
        field = {
            "id": norm_id,
            "fieldName": f"{clean_name} Field",
            "crop": "Soybean" if norm_id == "south" else "Wheat" if norm_id == "north" else "Cotton" if norm_id == "east" else "Maize",
            "cropStage": "Flowering",
            "acres": 28.0 if norm_id == "south" else 32.0 if norm_id == "north" else 36.0 if norm_id == "east" else 28.0,
            "soilType": "Clay" if norm_id == "south" else "Loamy" if norm_id == "north" else "Sandy Loam" if norm_id == "east" else "Sandy",
            "ndvi": 0.54 if norm_id == "south" else 0.72 if norm_id == "north" else 0.63 if norm_id == "east" else 0.41,
            "ndviTrend": "Decreasing",
            "moisture": 28.0 if norm_id == "south" else 41.0 if norm_id == "north" else 35.0 if norm_id == "east" else 22.0,
            "temperature": 34.0,
            "location": "Pune, Maharashtra"
        }
    else:
        # Avoid mutating DB object reference directly
        field = dict(field)
        if "fieldName" not in field:
            field["fieldName"] = field.get("name", f"{norm_id.capitalize()} Field")

    # 2. Add weather & forecast context using live location
    weather = WeatherService.get_live_weather(field.get("location", "Pune, Maharashtra"))
    # Save the weather values, but do NOT override the field's actual soil moisture ("moisture")
    field["temperature"] = weather["temp"]
    field["humidity"] = weather["humidity"]
    field["rainfall"] = weather["rainfall"]
    field["forecast"] = weather["forecast"]
    
    # 3. Add disease scan history context
    recent_scans = FirestoreService.get_recent_scans()
    field_scans = [s for s in recent_scans if s.get("fieldId") == norm_id]
    if field_scans:
        field["diseases"] = ", ".join([s.get("diagnosis", "") for s in field_scans if s.get("diagnosis")])
    else:
        field["diseases"] = "None"
        
    # 4. Add previous recommendations & farmer actions
    actions = FirestoreService.get_actions()
    field_actions = [a for a in actions if a.get("field_id") == norm_id]
    completed_actions = [a for a in field_actions if a.get("status") == "COMPLETED"]
    pending_actions = [a for a in field_actions if a.get("status") == "PENDING"]
    
    field["prevRecs"] = ", ".join([a.get("title", "") for a in pending_actions]) or "Improve irrigation frequency"
    field["recentActions"] = ", ".join([a.get("title", "") for a in completed_actions]) or "None"
    field["field_id"] = norm_id
    
    return field

@router.post("", response_model=AdvisoryResponse)
async def generate_general_advisory(request: AdvisoryRequest, lang: Optional[str] = None):
    # Fetch live weather to enrich forecast metadata, but NOT to override the client's telemetry!
    weather = WeatherService.get_live_weather(request.location)
    
    # Normalize clean field ID and name
    norm_id = "north"
    for fid in ["north", "south", "east", "west"]:
        if fid in request.field_id.lower():
            norm_id = fid
            break
            
    db_field = FirestoreService.get_field(norm_id)
    fieldName = db_field.get("name", f"{norm_id.capitalize()} Field") if db_field else f"{norm_id.capitalize()} Field"
    acres = db_field.get("acres", 28.0) if db_field else 28.0
    soilType = db_field.get("soilType", "Clay") if db_field else "Clay"

    context = {
        "field_id": norm_id,
        "fieldName": fieldName,
        "crop": request.crop,
        "cropStage": request.crop_stage,
        "acres": acres,
        "soilType": soilType,
        "ndvi": request.ndvi,
        "ndviTrend": "Decreasing",
        "moisture": request.moisture,  # RETAIN THE TRUE SOIL MOISTURE FROM REQUEST!
        "temperature": request.temperature, # RETAIN THE TRUE TEMPERATURE!
        "location": request.location,
        "humidity": weather["humidity"],  # Add air humidity properly
        "rainfall": weather["rainfall"],  # Add rainfall properly
        "forecast": weather["forecast"],  # Add forecast properly
        "diseases": request.diseases,
        "prevRecs": "Improve irrigation frequency",
        "recentActions": "None"
    }
    
    return GeminiService.generate_advisory(context, lang=lang or "en-IN")

@router.post("/{field_id}", response_model=AdvisoryResponse)
async def generate_field_advisory(field_id: str, lang: Optional[str] = None):
    try:
        context = get_aggregated_context(field_id)
        return GeminiService.generate_advisory(context, lang=lang or "en-IN")
    except Exception as e:
        logger.error(f"Failed to generate field advisory: {e}")
        raise HTTPException(status_code=500, detail=str(e))
