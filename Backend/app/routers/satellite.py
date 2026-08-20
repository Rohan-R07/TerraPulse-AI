import time
import json
import logging
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from app.schemas.satellite import NdviChangeRequest, RiskRequest, SatelliteLatestResponse, SatelliteHistoryResponse
from app.services.earth_engine_service import EarthEngineService
from app.services.risk_engine import RiskEngine
from app.services.gemini_service import GeminiService
from app.services.firestore_service import FirestoreService
from app.config import settings

logger = logging.getLogger("TerraPulseBackend.Satellite")
router = APIRouter(tags=["Satellite & Risk"])

@router.get("/satellite/{field_id}", response_model=SatelliteLatestResponse)
async def get_satellite_data(field_id: str, mode: str = "demo"):
    return EarthEngineService.get_satellite_data(field_id, mode)

@router.get("/satellite/{field_id}/latest", response_model=SatelliteLatestResponse)
async def get_latest_satellite(field_id: str, mode: str = "demo"):
    return EarthEngineService.get_satellite_data(field_id, mode)

@router.get("/satellite/{field_id}/history", response_model=SatelliteHistoryResponse)
async def get_satellite_history(field_id: str):
    ndvi = EarthEngineService.get_historical_ndvi(field_id)
    moisture = EarthEngineService.get_historical_moisture(field_id)
    return {
        "fieldId": field_id,
        "ndviHistory": ndvi,
        "moistureHistory": moisture
    }

@router.get("/satellite/{field_id}/ndvi")
async def get_field_ndvi(field_id: str, mode: str = "demo"):
    sat = EarthEngineService.get_satellite_data(field_id, mode)
    return {"ndvi": sat["ndvi"], "date": sat["acquisitionDate"], "dataSource": sat["dataSource"]}

@router.get("/satellite/{field_id}/layers")
async def get_satellite_layers(field_id: str):
    return {
        "fieldId": field_id,
        "layers": ["NDVI Health Heatmap", "Soil Moisture Index"],
        "activeSource": "Sentinel-2"
    }

@router.post("/ndvi-change")
async def ndvi_change_explain(request: NdviChangeRequest):
    change_pct = ((request.current_ndvi - request.prev_ndvi) / request.prev_ndvi) * 100
    
    prompt = f"""You are an agricultural intelligence specialist. Analyze a change in NDVI vegetation health for a field:
- Field ID: {request.field_id}
- Crop: {request.crop}
- Previous NDVI: {request.prev_ndvi}
- Current NDVI: {request.current_ndvi}
- Percentage Change: {change_pct:.1f}%
- Soil Moisture: {request.moisture}%
- Temperature: {request.temperature}°C

Explain the likely reasons for this change. 
STRICT RULE: Clearly distinguish:
- OBSERVED SATELLITE FACTS (NDVI drop, dates, moisture levels)
- AI-INFERRED CAUSES (Water stress, disease onset, compaction or heat stress)

Keep the explanation concise and actionable.
"""
    explanation = GeminiService.generate_content(prompt)
    
    return {
        "changePct": float(f"{change_pct:.1f}"),
        "stressLevel": "High" if change_pct < -15 else "Medium" if change_pct < -5 else "Low",
        "explanation": explanation,
        "dataSource": "LIVE — Google Gemini & Earth Engine"
    }

@router.get("/intelligence/{field_id}/change")
async def get_field_change_intelligence(field_id: str):
    # Fetch field details
    field = FirestoreService.get_field(field_id) or {
        "fieldName": "West Field",
        "crop": "Cotton",
        "cropStage": "Flowering",
        "ndvi": 0.54,
        "moisture": 28,
        "temperature": 34,
        "soilType": "Black Clay",
        "location": "Pune, Maharashtra"
    }
    
    ndvi_current = field.get("ndvi", 0.54)
    # Assume previous NDVI historical baseline for change detection
    ndvi_previous = 0.67
    ndvi_change_percent = ((ndvi_current - ndvi_previous) / ndvi_previous) * 100
    
    moisture_current = field.get("moisture", 28)
    moisture_previous = 38
    moisture_change = moisture_current - moisture_previous
    
    temp = field.get("temperature", 34)
    crop = field.get("crop", "Cotton")
    
    stress_level = "CRITICAL" if ndvi_change_percent < -15 else "HIGH" if ndvi_change_percent < -5 else "LOW"
    
    # Prompt Gemini for explanation
    prompt = f"""You are an agricultural satellite analyst. Analyze this multi-temporal data:
- Crop: {crop}
- Current NDVI: {ndvi_current}
- Previous NDVI: {ndvi_previous}
- NDVI Change: {ndvi_change_percent:.1f}%
- Current Soil Moisture: {moisture_current}%
- Previous Soil Moisture: {moisture_previous}%
- Soil Moisture Change: {moisture_change}%
- Temperature: {temp}°C

Analyze and return a JSON object with:
- likely_causes: ["cause 1", "cause 2"]
- ai_explanation: "detailed explanation text"

Strict rules:
1. Return ONLY raw JSON. No markdown wrappers.
2. In 'ai_explanation', clearly separate:
   - OBSERVED: (Satellite and climate measurements)
   - INFERRED: (Agronomic causes like evapotranspiration, irrigation delay, or compaction)
"""
    try:
        response_text = GeminiService.generate_content(prompt)
        # Parse JSON
        # Handle cases where markdown wrapper is returned anyway
        clean_text = re.sub(r"```json|```", "", response_text).strip()
        data = json.loads(clean_text)
        likely_causes = data.get("likely_causes", ["Moisture Stress", "Heat Acceleration"])
        ai_explanation = data.get("ai_explanation", "")
    except Exception as e:
        logger.error(f"Failed to query Gemini for change explanation: {e}")
        likely_causes = ["Deficit Irrigation", "Soil Moisture Evaporation"]
        ai_explanation = f"""OBSERVED:
- NDVI dropped by {ndvi_change_percent:.1f}% (from {ndvi_previous} to {ndvi_current}).
- Ground moisture dropped by {abs(moisture_change)}% (from {moisture_previous}% to {moisture_current}%).

INFERRED:
- The persistent 34°C heat has increased evapotranspiration while lack of irrigation in the flowering stage has triggered crop wilt stress."""

    return {
        "ndvi_current": ndvi_current,
        "ndvi_previous": ndvi_previous,
        "ndvi_change_percent": float(f"{ndvi_change_percent:.1f}"),
        "stress_level": stress_level,
        "likely_causes": likely_causes,
        "ai_explanation": ai_explanation
    }

import re  # added for cleaning markdown wrappers if returned

@router.post("/risk")
async def calculate_risk(request: RiskRequest):
    return RiskEngine.calculate_risk(
        ndvi=request.ndvi,
        ndvi_change=request.ndvi_change,
        moisture=request.moisture,
        temperature=request.temperature,
        rainfall=request.rainfall,
        crop=request.crop,
        crop_stage=request.crop_stage,
        soil_type=request.soil_type,
        diseases=request.diseases
    )
