from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class NdviChangeRequest(BaseModel):
    field_id: str
    prev_ndvi: float
    current_ndvi: float
    crop: str
    moisture: float
    temperature: float

class RiskRequest(BaseModel):
    ndvi: float
    ndvi_change: float
    moisture: float
    temperature: float
    rainfall: float
    crop: str
    crop_stage: str
    soil_type: str
    diseases: str

class SatelliteLatestResponse(BaseModel):
    fieldId: str
    dataSource: str
    isLive: bool
    ndvi: float
    prevNdvi: float
    acquisitionDate: str
    cloudCover: float
    resolution: str
    status: str

class HistoryDataPoint(BaseModel):
    date: str
    value: float

class SatelliteHistoryResponse(BaseModel):
    fieldId: str
    ndviHistory: List[HistoryDataPoint]
    moistureHistory: List[HistoryDataPoint]
