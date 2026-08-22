import logging
from typing import List
from app.services.gemini_service import GeminiService

logger = logging.getLogger("TerraPulseBackend.CarbonEngine")

class CarbonEngine:
    @staticmethod
    def calculate_single_scenario(soil_type: str, acreage: float, rotation: List[str], scenario_type: str) -> dict:
        soc_bases = {"clay-loam": 1.6, "silt-loam": 1.4, "sandy-loam": 0.8}
        soc_base = soc_bases.get(soil_type, 1.2)
        
        water_demand_index = 0
        carbon_inputs = 0
        resilience_factors = 0
        
        for crop in rotation:
            c = crop.lower()
            if c in ["rice", "sugarcane"]:
                water_demand_index += 90
                carbon_inputs += 1.0
                resilience_factors += 50
            elif c in ["wheat", "maize", "corn"]:
                water_demand_index += 55
                carbon_inputs += 1.2
                resilience_factors += 65
            elif c in ["sunnhemp", "cowpea", "clover", "cover-crop"]:
                water_demand_index += 15
                carbon_inputs += 2.0
                resilience_factors += 90
            elif c in ["cotton", "soybeans"]:
                water_demand_index += 45
                carbon_inputs += 1.1
                resilience_factors += 60
            else:
                water_demand_index += 10
                carbon_inputs += 0.5
                resilience_factors += 40
                
        avg_water = water_demand_index / max(1, len(rotation))
        avg_carbon = carbon_inputs / max(1, len(rotation))
        avg_resilience = resilience_factors / max(1, len(rotation))
        
        if scenario_type == "regenerative":
            avg_carbon *= 1.3
            avg_resilience += 15
            avg_water *= 0.85
        elif scenario_type == "water-efficient":
            avg_water *= 0.55
            avg_resilience += 10
            
        soc_projected = soc_base * (1 + 0.12 * avg_carbon)
        seq_rate = 0.35 * avg_carbon
        total_seq = seq_rate * acreage
        annual_credits = total_seq * 0.9
        
        return {
            "socCurrent": soc_base,
            "socProjected": round(soc_projected, 2),
            "sequestrationRate": round(seq_rate, 2),
            "totalSequestration": round(total_seq, 1),
            "annualCredits": round(annual_credits, 1),
            "waterDemand": round(avg_water, 0),
            "resilience": round(min(98.0, avg_resilience), 0),
            "yieldDirection": "Increase (+8%)" if avg_resilience > 70 else "Stable" if avg_resilience > 55 else "Decrease (-5%)"
        }

    @classmethod
    def simulate_carbon(
        cls,
        soil_type: str,
        acreage: float,
        historical_yield: float,
        rotation_a: List[str],
        rotation_b: List[str],
        rotation_c: List[str],
        lang: str = "en-IN"
    ) -> dict:
        results_a = cls.calculate_single_scenario(soil_type, acreage, rotation_a, "current")
        results_b = cls.calculate_single_scenario(soil_type, acreage, rotation_b, "regenerative")
        results_c = cls.calculate_single_scenario(soil_type, acreage, rotation_c, "water-efficient")
        
        prompt = f"""You are a regenerative agriculture consultant. A farmer simulated 3 rotation scenarios on {acreage} acres of {soil_type} soil (Historical Yield: {historical_yield} tons/acre):

SCENARIO A (Current Practice):
- Rotation: {rotation_a}
- Projected SOC: {results_a['socProjected']}% (Current: {results_a['socCurrent']}%)
- Carbon Credits: {results_a['annualCredits']} tCO2e/yr
- Water Demand Index: {results_a['waterDemand']}/100
- Climate Resilience: {results_a['resilience']}/100
- Yield Outlook: {results_a['yieldDirection']}

SCENARIO B (Regenerative Agriculture):
- Rotation: {rotation_b}
- Projected SOC: {results_b['socProjected']}%
- Carbon Credits: {results_b['annualCredits']} tCO2e/yr
- Water Demand Index: {results_b['waterDemand']}/100
- Climate Resilience: {results_b['resilience']}/100
- Yield Outlook: {results_b['yieldDirection']}

SCENARIO C (Water-Efficient Rotation):
- Rotation: {rotation_c}
- Projected SOC: {results_c['socProjected']}%
- Carbon Credits: {results_c['annualCredits']} tCO2e/yr
- Water Demand Index: {results_c['waterDemand']}/100
- Climate Resilience: {results_c['resilience']}/100
- Yield Outlook: {results_c['yieldDirection']}

Provide a professional, localized assessment:
1. Recommended strategy between B and C.
2. Why this strategy outpaces A in terms of soil health and economics.
3. Trade-offs (e.g. initial cover crop seed costs vs long-term nitrogen savings & carbon credits).
4. Practical 3-year implementation timeline.

STRICT RULE: Do NOT invent or alter the numerical metrics calculated above. Ground your advice strictly in the values provided.
"""
        strategy_analysis = GeminiService.generate_content(prompt, lang=lang)
        
        return {
            "scenarioA": results_a,
            "scenarioB": results_b,
            "scenarioC": results_c,
            "strategyAnalysis": strategy_analysis,
            "dataSource": "LIVE — Deterministic Simulator + Gemini"
        }
