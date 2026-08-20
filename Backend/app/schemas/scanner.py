from pydantic import BaseModel
from typing import List

class PlantScanResponse(BaseModel):
    diagnosis: str
    confidence: float
    severity: str  # low|moderate|high|critical
    symptoms: List[str]
    possible_causes: List[str]
    immediate_actions: List[str]
    prevention: List[str]
    field_inspection_required: bool
    disclaimer: str = "AI-assisted agricultural guidance"
    source: str = "demo"
    timestamp: str = ""

class SoilScanResponse(BaseModel):
    soil_condition: str
    degradation_indicators: List[str]
    compaction_indicators: List[str]
    organic_matter_clues: str
    nutrient_stress_clues: List[str]
    recommended_tests: List[str]
    regenerative_practices: List[str]
    disclaimer: str = "Visual estimation only. This tool does not replace a wet-lab soil test."
    source: str = "demo"
    timestamp: str = ""
