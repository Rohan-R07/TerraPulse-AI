from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class ActionItem(BaseModel):
    field: Optional[str] = "West Field"
    field_id: Optional[str] = "west-field"
    recommendation: Optional[str] = None
    title: Optional[str] = None
    priority: str
    dueDate: Optional[str] = None
    due_date: Optional[str] = None
    source: str = "ai_advisory"  # ai_advisory|disease_scan|risk_engine
    status: str = "PENDING"      # PENDING|COMPLETED|DISMISSED
    reason: Optional[str] = "Recommendation created by AI advisory engine"

class FeedbackItem(BaseModel):
    actionId: str
    action: str
    field: str
    previousRisk: str
    outcome: str
    subsequentObservations: Optional[str] = "NDVI and Moisture stabilized"
    timestamp: Optional[str] = None


class FieldBase(BaseModel):
    crop: str
    crop_stage: str
    acreage: float
    soil_type: str
    state: str
    district: str
    location: str
    geometry: Optional[Dict[str, Any]] = None
    health_score: float = 75.0
    risk_level: str = "LOW"
    
    # Frontend backward compatibility fields
    name: Optional[str] = None
    acres: Optional[float] = None
    health: Optional[float] = None
    ndvi: Optional[float] = None
    moisture: Optional[float] = None
    risk: Optional[str] = None
    vegetation: Optional[str] = None
    stress: Optional[str] = None
    soilType: Optional[str] = None
    recommendations: Optional[List[str]] = []
    polygon: Optional[List[List[float]]] = []

class FieldCreate(FieldBase):
    pass

class FieldUpdate(BaseModel):
    crop: Optional[str] = None
    crop_stage: Optional[str] = None
    acreage: Optional[float] = None
    soil_type: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    location: Optional[str] = None
    geometry: Optional[Dict[str, Any]] = None
    health_score: Optional[float] = None
    risk_level: Optional[str] = None

class FieldResponse(FieldBase):
    id: str

class FarmBase(BaseModel):
    name: str
    location: str

class FarmCreate(FarmBase):
    pass

class FarmResponse(FarmBase):
    id: str
    fields: List[FieldResponse] = []
