import time
import json
import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from app.config import settings
from app.services.gemini_service import GeminiService
from app.utils.security import validate_uploaded_image
from app.schemas.scanner import PlantScanResponse, SoilScanResponse

router = APIRouter(prefix="/scanner", tags=["Scanner"])
logger = logging.getLogger("TerraPulseBackend.Scanner")

@router.post("/plant")
async def scan_plant(
    image: UploadFile = File(...),
    crop: Optional[str] = Form(None),
    field_id: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    crop_stage: Optional[str] = Form(None)
):
    validate_uploaded_image(image)
    try:
        image_bytes = await image.read()
        
        # Call structured Gemini vision diagnostics
        diag = GeminiService.generate_plant_diagnosis(
            image_bytes=image_bytes,
            mime_type=image.content_type,
            crop=crop or "Cotton",
            field_id=field_id or "Unknown Field",
            location=location or "Pune, Maharashtra",
            crop_stage=crop_stage or "Flowering"
        )
        
        # Build backwards compatible analysis string
        symptoms_str = ", ".join(diag.get("symptoms", []))
        actions_str = "\n".join([f"- {a}" for a in diag.get("immediate_actions", [])])
        prev_str = "\n".join([f"- {p}" for p in diag.get("prevention", [])])
        causes_str = ", ".join(diag.get("possible_causes", []))
        
        analysis_markdown = f"""### AI-ASSISTED DIAGNOSIS: This assessment is based on machine learning vision analysis. Please verify on-field.

**Diagnosis**: {diag.get('diagnosis')}
**Severity**: {diag.get('severity').upper()} (Confidence: {diag.get('confidence') * 100:.0f}%)

**Observed Symptoms**: {symptoms_str}
**Likely Causes**: {causes_str}

**Immediate Actions**:
{actions_str}

**Prevention**:
{prev_str}

**Field Inspection Required**: {'Yes' if diag.get('field_inspection_required') else 'No'}

*Disclaimer: {diag.get('disclaimer')}*"""

        # Return combined schema for backwards compatibility + new requirements
        return {
            "diagnosis": diag.get("diagnosis"),
            "confidence": diag.get("confidence"),
            "severity": diag.get("severity"),
            "symptoms": diag.get("symptoms"),
            "possible_causes": diag.get("possible_causes"),
            "immediate_actions": diag.get("immediate_actions"),
            "prevention": diag.get("prevention"),
            "field_inspection_required": diag.get("field_inspection_required"),
            "disclaimer": diag.get("disclaimer"),
            "source": diag.get("source", "demo"),
            "timestamp": diag.get("timestamp", ""),
            # Compatibility keys:
            "crop": crop or "Cotton",
            "disease": diag.get("diagnosis"),
            "analysis": analysis_markdown,
            "dataSource": f"LIVE — Gemini Visual Diagnostics ({diag.get('source', 'demo')})"
        }
    except Exception as e:
        logger.error(f"Error in scan plant: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/soil")
async def scan_soil(image: UploadFile = File(...)):
    validate_uploaded_image(image)
    try:
        image_bytes = await image.read()
        
        # Call structured Gemini soil analysis
        soil = GeminiService.generate_soil_diagnosis(image_bytes, image.content_type)
        
        degradation_str = ", ".join(soil.get("degradation_indicators", []))
        compaction_str = ", ".join(soil.get("compaction_indicators", []))
        nutrients_str = ", ".join(soil.get("nutrient_stress_clues", []))
        tests_str = "\n".join([f"- {t}" for t in soil.get("recommended_tests", [])])
        practices_str = "\n".join([f"- {p}" for p in soil.get("regenerative_practices", [])])
        
        # Build backwards compatible analysis string
        analysis_markdown = f"""### VISUAL SOIL ESTIMATION: Not a chemical laboratory analysis.

**Condition**: {soil.get('soil_condition')}
**Organic Matter Clues**: {soil.get('organic_matter_clues')}

**Degradation Indicators**: {degradation_str}
**Compaction Indicators**: {compaction_str}
**Nutrient Stress Indicators**: {nutrients_str}

**Recommended Tests**:
{tests_str}

**Regenerative Practices**:
{practices_str}

*Disclaimer: {soil.get('disclaimer')}*"""

        return {
            "soil_condition": soil.get("soil_condition"),
            "degradation_indicators": soil.get("degradation_indicators"),
            "compaction_indicators": soil.get("compaction_indicators"),
            "organic_matter_clues": soil.get("organic_matter_clues"),
            "nutrient_stress_clues": soil.get("nutrient_stress_clues"),
            "recommended_tests": soil.get("recommended_tests"),
            "regenerative_practices": soil.get("regenerative_practices"),
            "disclaimer": soil.get("disclaimer"),
            "source": soil.get("source", "demo"),
            "timestamp": soil.get("timestamp", ""),
            # Compatibility keys:
            "analysis": analysis_markdown,
            "dataSource": f"LIVE — Gemini Visual Soil Estimation ({soil.get('source', 'demo')})"
        }
    except Exception as e:
        logger.error(f"Error in soil scanner: {e}")
        raise HTTPException(status_code=500, detail=str(e))
