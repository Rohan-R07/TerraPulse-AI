from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class ScenarioRequest(BaseModel):
    soilType: str
    acreage: float
    historicalYield: float
    rotationA: List[str]
    rotationB: List[str]
    rotationC: List[str]

class ScenarioMetrics(BaseModel):
    socCurrent: float
    socProjected: float
    sequestrationRate: float
    totalSequestration: float
    annualCredits: float
    waterDemand: float
    resilience: float
    yieldDirection: str

class ScenarioResponse(BaseModel):
    scenarioA: ScenarioMetrics
    scenarioB: ScenarioMetrics
    scenarioC: ScenarioMetrics
    strategyAnalysis: str
    dataSource: str
    recommended_strategy: Optional[str] = None
    why: Optional[str] = None
    trade_offs: Optional[str] = None
    timeline: Optional[str] = None
