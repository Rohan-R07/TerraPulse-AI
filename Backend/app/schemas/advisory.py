from pydantic import BaseModel
from typing import List, Optional

class AdvisoryRequest(BaseModel):
    field_id: str
    crop: str
    crop_stage: str
    ndvi: float
    moisture: float
    temperature: float
    diseases: str
    location: str

class AdvisoryRecommendation(BaseModel):
    action: str
    priority: str
    timeline: str
    reason: str
    expected_benefit: str

class AdvisoryResponse(BaseModel):
    field_status: str
    risk_level: str  # LOW|MEDIUM|HIGH|CRITICAL
    primary_risk: str
    risk_factors: List[str]
    recommendations: List[AdvisoryRecommendation]
    water_guidance: str
    soil_guidance: str
    crop_guidance: str
    disease_guidance: str
    regenerative_practice: str
    explanation: str
    # Keep backward compatibility fields
    advisory: Optional[str] = None
    riskScore: Optional[float] = None
    riskStatus: Optional[str] = None
    dataSource: Optional[str] = "demo"
