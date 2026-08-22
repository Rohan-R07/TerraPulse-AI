import logging
from fastapi import APIRouter
from typing import Optional
from app.schemas.simulator import ScenarioRequest, ScenarioResponse
from app.services.carbon_engine import CarbonEngine
from app.services.gemini_service import GeminiService

logger = logging.getLogger("TerraPulseBackend.Simulator")
router = APIRouter(prefix="/simulator", tags=["Carbon Simulator"])

@router.post("/carbon", response_model=ScenarioResponse)
async def simulate_carbon(request: ScenarioRequest, lang: Optional[str] = None):
    result = CarbonEngine.simulate_carbon(
        soil_type=request.soilType,
        acreage=request.acreage,
        historical_yield=request.historicalYield,
        rotation_a=request.rotationA,
        rotation_b=request.rotationB,
        rotation_c=request.rotationC,
        lang=lang or "en-IN"
    )
    
    # Enrich with structured details
    try:
        gemini_res = GeminiService.generate_rotation_comparison(result, lang=lang or "en-IN")
        result["recommended_strategy"] = gemini_res.get("recommended_strategy")
        result["why"] = gemini_res.get("why")
        result["trade_offs"] = gemini_res.get("trade_offs")
        result["timeline"] = gemini_res.get("timeline")
    except Exception as e:
        logger.error(f"Failed to generate structured comparison: {e}")
        
    return result

@router.post("/compare", response_model=ScenarioResponse)
async def compare_scenarios(request: ScenarioRequest, lang: Optional[str] = None):
    result = CarbonEngine.simulate_carbon(
        soil_type=request.soilType,
        acreage=request.acreage,
        historical_yield=request.historicalYield,
        rotation_a=request.rotationA,
        rotation_b=request.rotationB,
        rotation_c=request.rotationC,
        lang=lang or "en-IN"
    )
    
    # Call structured Gemini analyzer
    try:
        gemini_res = GeminiService.generate_rotation_comparison(result, lang=lang or "en-IN")
        result["recommended_strategy"] = gemini_res.get("recommended_strategy")
        result["why"] = gemini_res.get("why")
        result["trade_offs"] = gemini_res.get("trade_offs")
        result["timeline"] = gemini_res.get("timeline")
    except Exception as e:
        logger.error(f"Failed to generate structured comparison: {e}")
        
    return result
