import logging
from app.services.gemini_service import GeminiService

logger = logging.getLogger("TerraPulseBackend.RiskEngine")

class RiskEngine:
    @staticmethod
    def calculate_risk(
        ndvi: float,
        ndvi_change: float,
        moisture: float,
        temperature: float,
        rainfall: float,
        crop: str,
        crop_stage: str,
        soil_type: str,
        diseases: str
    ) -> dict:
        # Baseline score
        score = 15.0
        
        # 1. NDVI Change drop adds score
        if ndvi_change < 0:
            score += abs(ndvi_change) * 1.5
            
        # 2. Moisture depletion adds score
        if moisture < 35:
            score += (35 - moisture) * 1.8
            
        # 3. High/low temperature stress
        if temperature > 38:
            score += (temperature - 38) * 2.0
        elif temperature < 12:
            score += (12 - temperature) * 1.5
            
        # 4. Low rainfall
        if rainfall < 10:
            score += (10 - rainfall) * 1.2
            
        # 5. Disease presence adds significant score
        if diseases.lower() != "none" and diseases.strip() != "":
            score += 25.0
            
        # Cap score
        score = min(100.0, max(0.0, score))
        score = round(score, 1)
        
        # Define status
        if score <= 30:
            status = "LOW"
        elif score <= 60:
            status = "MEDIUM"
        elif score <= 80:
            status = "HIGH"
        else:
            status = "CRITICAL"
            
        # Ask Gemini to explain the risk factors based on this calculated score
        prompt = f"""You are a farm risk analyst. The deterministic risk engine calculated a risk score of {score}/100 ({status} Risk) for a {crop} ({crop_stage} stage) on {soil_type} soil.
Parameters:
- Current NDVI: {ndvi}
- NDVI Change: {ndvi_change}%
- Soil Moisture: {moisture}%
- Temp: {temperature}°C
- Rainfall: {rainfall}mm
- Diseases: {diseases}

Explain why this risk score was calculated, summarizing the primary risk factors, urgency of intervention, and immediate recommended steps. 
STRICT RULE: Do NOT generate a different numerical score. Ground your explanation exactly in the calculated score of {score}/100 ({status}).
"""
        explanation = GeminiService.generate_content(prompt)
        
        return {
            "riskScore": score,
            "riskStatus": status,
            "explanation": explanation,
            "urgency": "Immediate (24 hours)" if status in ["HIGH", "CRITICAL"] else "Watchful (72 hours)" if status == "MEDIUM" else "Standard Monitoring",
            "dataSource": "LIVE — Deterministic Engine + Gemini"
        }
