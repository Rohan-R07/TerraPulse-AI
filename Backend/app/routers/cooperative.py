import time
from fastapi import APIRouter, Query, Body
from typing import Optional, List, Dict, Any

router = APIRouter(tags=["Regional Cooperative Intelligence"])

# In-memory community reported insights pool
COMMUNITY_INSIGHTS = [
    {
        "id": "coop-1",
        "title": "Rice Blast Alert (Telangana & Karnataka)",
        "detail": "Rice Blast outbreaks are spreading across Raichur and Nalgonda districts due to sudden high relative humidity. 18% of monitored farms report symptoms. Early application of Tricyclazole or biological Pseudomonas fluorescens is recommended.",
        "type": "disease",
        "severity": "High",
        "state": "Telangana",
        "district": "Nalgonda",
        "crop": "Rice",
        "season": "Kharif",
        "timestamp": "2026-08-20T10:00:00Z"
    },
    {
        "id": "coop-2",
        "title": "Water Stress Warning (Punjab)",
        "detail": "Deep tubewell irrigation is depleting groundwater tables at critical rates. Alternating irrigation (AWD) has saved 22% of community water levels in Patiala. Joint community action is recommended to enforce pani-pipe water checks.",
        "type": "water",
        "severity": "Critical",
        "state": "Punjab",
        "district": "Patiala",
        "crop": "Wheat",
        "season": "Rabi",
        "timestamp": "2026-08-19T12:00:00Z"
    },
    {
        "id": "coop-3",
        "title": "Soil Organic Carbon Gains (Maharashtra)",
        "detail": "Aggregated data from 120 cotton farms in Amravati using sunn-hemp cover cropping shows an average SOC increase of +0.22% over 2 years. Joint credit pooling will increase carbon credit valuation by 15%.",
        "type": "regen",
        "severity": "Success",
        "state": "Maharashtra",
        "district": "Amravati",
        "crop": "Cotton",
        "season": "Kharif",
        "timestamp": "2026-08-18T16:00:00Z"
    }
]

# Legacy Data Breakdown
state_data = {
    "Maharashtra": {"monitoredFarms": 1280, "cropStress": 22, "diseaseTrend": "Down (Bt Adoption)", "waterStress": 45, "regenAdoption": 34, "risk": "Medium"},
    "Karnataka": {"monitoredFarms": 940, "cropStress": 18, "diseaseTrend": "Up (Rice Blast)", "waterStress": 32, "regenAdoption": 28, "risk": "High"},
    "Punjab": {"monitoredFarms": 2100, "cropStress": 12, "diseaseTrend": "Stable", "waterStress": 78, "regenAdoption": 15, "risk": "Critical"},
    "Uttar Pradesh": {"monitoredFarms": 3400, "cropStress": 15, "diseaseTrend": "Stable", "waterStress": 24, "regenAdoption": 18, "risk": "Medium"},
    "Telangana": {"monitoredFarms": 850, "cropStress": 25, "diseaseTrend": "Up (Cotton Bollworm)", "waterStress": 55, "regenAdoption": 42, "risk": "High"},
    "West Bengal": {"monitoredFarms": 1520, "cropStress": 8, "diseaseTrend": "Stable", "waterStress": 12, "regenAdoption": 20, "risk": "Low"}
}

@router.get("/india-intelligence")
async def get_india_intelligence(
    state: str = "All",
    district: str = "All",
    crop: str = "All",
    season: str = "All"
):
    if state != "All":
        stats = state_data.get(state, {"monitoredFarms": 350, "cropStress": 15, "diseaseTrend": "Stable", "waterStress": 25, "regenAdoption": 20, "risk": "Medium"})
    else:
        total_farms = sum(v["monitoredFarms"] for v in state_data.values())
        avg_stress = int(sum(v["cropStress"] for v in state_data.values()) / len(state_data))
        avg_water = int(sum(v["waterStress"] for v in state_data.values()) / len(state_data))
        avg_regen = int(sum(v["regenAdoption"] for v in state_data.values()) / len(state_data))
        stats = {
            "monitoredFarms": total_farms,
            "cropStress": avg_stress,
            "diseaseTrend": "Slight Outbreaks (Rice Blast, Pink Bollworm)",
            "waterStress": avg_water,
            "regenAdoption": avg_regen,
            "risk": "High"
        }
        
    return {
        "filters": {"state": state, "district": district, "crop": crop, "season": season},
        "stats": stats,
        "statesBreakdown": state_data,
        "dataSource": "DEMO — National Aggregation Engine"
    }

@router.get("/cooperative-insights")
async def get_cooperative_insights_legacy(state: str = "All", crop: str = "All"):
    insights = [
        {"title": "Rice Blast Alert (Telangana & Karnataka)", "detail": "Rice Blast outbreaks are spreading across Raichur and Nalgonda districts due to sudden high relative humidity. 18% of monitored farms report symptoms. Early application of Tricyclazole or biological Pseudomonas fluorescens is recommended.", "type": "disease", "severity": "High"},
        {"title": "Water Stress Warning (Punjab)", "detail": "Deep tubewell irrigation is depleting groundwater tables at critical rates. Alternating irrigation (AWD) has saved 22% of community water levels in Patiala. Joint community action is recommended to enforce pani-pipe water checks.", "type": "water", "severity": "Critical"},
        {"title": "Soil Organic Carbon Gains (Maharashtra)", "detail": "Aggregated data from 120 cotton farms in Amravati using sunn-hemp cover cropping shows an average SOC increase of +0.22% over 2 years. Joint credit pooling will increase carbon credit valuation by 15%.", "type": "regen", "severity": "Success"}
    ]
    return {
        "insights": insights,
        "coopAdoptionRate": "28% Regional Avg",
        "dataSource": "DEMO — Cooperative Intelligence Pool"
    }

@router.get("/cooperative/insights")
async def get_cooperative_insights(
    state: str = Query("All"),
    district: str = Query("All"),
    crop: str = Query("All"),
    season: str = Query("All")
):
    filtered = []
    for insight in COMMUNITY_INSIGHTS:
        if state != "All" and insight["state"].lower() != state.lower():
            continue
        if district != "All" and insight["district"].lower() != district.lower():
            continue
        if crop != "All" and insight["crop"].lower() != crop.lower():
            continue
        if season != "All" and insight["season"].lower() != season.lower():
            continue
        filtered.append(insight)
        
    total_farms = 0
    total_stress = 0
    total_water = 0
    total_regen = 0
    count = 0
    
    for st_name, val in state_data.items():
        if state == "All" or st_name.lower() == state.lower():
            total_farms += val["monitoredFarms"]
            total_stress += val["cropStress"]
            total_water += val["waterStress"]
            total_regen += val["regenAdoption"]
            count += 1
            
    avg_stress = int(total_stress / max(1, count))
    avg_water = int(total_water / max(1, count))
    avg_regen = int(total_regen / max(1, count))
    
    stats = {
        "monitoredFarms": total_farms,
        "cropStress": avg_stress,
        "diseaseTrend": "Up (Rice Blast, Cotton Bollworm)" if avg_stress > 20 else "Stable",
        "waterStress": avg_water,
        "regenAdoption": avg_regen,
        "risk": "High" if avg_stress > 20 or avg_water > 50 else "Medium"
    }

    return {
        "success": True,
        "insights": filtered,
        "coopAdoptionRate": f"{avg_regen}% Regional Avg",
        "stats": stats,
        "statesBreakdown": state_data,
        "meta": {
            "source": "live" if len(filtered) > 0 else "demo",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "filters": {"state": state, "district": district, "crop": crop, "season": season}
        }
    }

@router.post("/cooperative/insights")
async def post_cooperative_insight(
    title: str = Body(...),
    detail: str = Body(...),
    type: str = Body("disease"),
    severity: str = Body("Medium"),
    state: str = Body("Maharashtra"),
    district: str = Query("All"),
    crop: str = Body("Cotton"),
    season: str = Body("Kharif")
):
    new_insight = {
        "id": f"coop-{len(COMMUNITY_INSIGHTS) + 1}",
        "title": title,
        "detail": detail,
        "type": type,
        "severity": severity,
        "state": state,
        "district": district,
        "crop": crop,
        "season": season,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    }
    COMMUNITY_INSIGHTS.insert(0, new_insight)
    return {
        "success": True,
        "data": new_insight
    }
