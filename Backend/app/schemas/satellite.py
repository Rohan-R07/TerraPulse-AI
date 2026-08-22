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
    ndvi: Optional[float] = None
    prevNdvi: Optional[float] = None
    acquisitionDate: Optional[str] = None
    cloudCover: Optional[float] = None
    resolution: Optional[str] = None
    status: Optional[str] = None
    requested_date: Optional[str] = None
    actual_image_date: Optional[str] = None
    image_available: Optional[bool] = None
    message: Optional[str] = None

class HistoryDataPoint(BaseModel):
    date: str
    value: float

class SatelliteHistoryResponse(BaseModel):
    fieldId: str
    ndviHistory: List[HistoryDataPoint]
    moistureHistory: List[HistoryDataPoint]
