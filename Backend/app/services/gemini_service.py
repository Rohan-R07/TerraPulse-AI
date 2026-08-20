import time
import json
import logging
import re
import google.generativeai as genai
from app.config import settings
from app.utils.audit import AIAuditor

logger = logging.getLogger("TerraPulseBackend.Gemini")

class GeminiService:
    _initialized = False

    @classmethod
    def _initialize(cls):
        if not cls._initialized:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                cls._initialized = True
            except Exception as e:
                logger.error(f"Error configuring Gemini SDK: {e}")

    @classmethod
    def generate_plant_diagnosis(cls, image_bytes: bytes, mime_type: str, crop: str = "Unknown", field_id: str = "Unknown", location: str = "Unknown", crop_stage: str = "Unknown") -> dict:
        feature = "plant_scanner"
        model_name = "gemini-1.5-flash"
        start_time = time.time()
        
        if settings.TERRAPULSE_DEMO_MODE:
            latency = (time.time() - start_time) * 1000
            fallback = cls._get_plant_vision_fallback(crop)
            AIAuditor.log_operation(model_name, feature, field_id, "v1_plant_scan", latency, True)
            return fallback

        cls._initialize()
        try:
            model = genai.GenerativeModel(model_name)
            img_data = {"mime_type": mime_type or "image/jpeg", "data": image_bytes}
            
            prompt = f"""You are a plant pathology and crop diagnostic vision system. Analyze this plant leaf/crop image.
Context details provided by farmer:
- Crop type: {crop}
- Field: {field_id}
- Location: {location}
- Crop Growth Stage: {crop_stage}

You must return a JSON object conforming exactly to this structure:
{{
  "diagnosis": "name of disease or physical condition. If healthy, state 'Healthy Crop'",
  "confidence": 0.0 to 1.0 (float confidence score),
  "severity": "low" or "moderate" or "high" or "critical",
  "symptoms": ["list of visible plant symptoms observed"],
  "possible_causes": ["list of environmental, biological, nutrient, or pathogen causes"],
  "immediate_actions": ["list of immediate curative or remedial actions (e.g. chemical names, organic sprays)"],
  "prevention": ["list of long-term prevention strategies (e.g. rotations, resistant varieties)"],
  "field_inspection_required": true or false,
  "disclaimer": "AI-assisted agricultural guidance"
}}

Strict rules:
1. Return ONLY the raw JSON block. No markdown wrapper (like ```json), no explaining text.
2. Be conservative. Do not claim absolute certainty.
3. If the image is not a plant or leaf, indicate 'Unrecognized Image' in the diagnosis field with low confidence.
"""
            response = model.generate_content(
                [img_data, prompt],
                generation_config={"response_mime_type": "application/json"}
            )
            
            latency = (time.time() - start_time) * 1000
            data = json.loads(response.text.strip())
            # Ensure required keys exist
            data["source"] = "live"
            data["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
            AIAuditor.log_operation(model_name, feature, field_id, "v1_plant_scan", latency, True)
            return data
        except Exception as e:
            latency = (time.time() - start_time) * 1000
            logger.error(f"Gemini plant vision analysis failed: {e}. Using fallback.")
            AIAuditor.log_operation(model_name, feature, field_id, "v1_plant_scan", latency, False, str(e))
            fallback = cls._get_plant_vision_fallback(crop)
            fallback["source"] = "demo"
            fallback["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
            return fallback

    @classmethod
    def generate_soil_diagnosis(cls, image_bytes: bytes, mime_type: str) -> dict:
        feature = "soil_scanner"
        model_name = "gemini-1.5-flash"
        start_time = time.time()
        
        if settings.TERRAPULSE_DEMO_MODE:
            latency = (time.time() - start_time) * 1000
            fallback = cls._get_soil_vision_fallback()
            AIAuditor.log_operation(model_name, feature, "Unknown", "v1_soil_scan", latency, True)
            return fallback

        cls._initialize()
        try:
            model = genai.GenerativeModel(model_name)
            img_data = {"mime_type": mime_type or "image/jpeg", "data": image_bytes}
            
            prompt = """You are a soil conservation and agronomic soil visual inspection assistant. Analyze this soil image.
You must return a JSON object conforming exactly to this structure:
{{
  "soil_condition": "description of visible soil texture, moisture, structure, and type",
  "degradation_indicators": ["list of visible signs of erosion, salinity, scaling, or cracking"],
  "compaction_indicators": ["list of indicators showing potential soil compaction or lack of aeration"],
  "organic_matter_clues": "visual clues regarding organic carbon content (e.g. soil color darkness)",
  "nutrient_stress_clues": ["list of visible clues pointing to N-P-K deficiency from crop residue or nearby weeds"],
  "recommended_tests": ["list of recommended wet-lab soil chemical/biological tests"],
  "regenerative_practices": ["list of soil-building regenerative suggestions like cover cropping, zero-till"],
  "disclaimer": "Visual estimation only. This tool does not replace a wet-lab chemical soil test."
}}

Strict rules:
1. Return ONLY the raw JSON block. No markdown wrapper (like ```json), no explaining text.
2. Clearly distinguish visual estimation from laboratory measurements.
3. NEVER claim exact nutrient percentages (like 'N is 1.2%') from a photograph.
"""
            response = model.generate_content(
                [img_data, prompt],
                generation_config={"response_mime_type": "application/json"}
            )
            
            latency = (time.time() - start_time) * 1000
            data = json.loads(response.text.strip())
            data["source"] = "live"
            data["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
            AIAuditor.log_operation(model_name, feature, "Unknown", "v1_soil_scan", latency, True)
            return data
        except Exception as e:
            latency = (time.time() - start_time) * 1000
            logger.error(f"Gemini soil vision analysis failed: {e}. Using fallback.")
            AIAuditor.log_operation(model_name, feature, "Unknown", "v1_soil_scan", latency, False, str(e))
            fallback = cls._get_soil_vision_fallback()
            fallback["source"] = "demo"
            fallback["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
            return fallback

    @classmethod
    def generate_advisory(cls, context: dict) -> dict:
        feature = "agronomic_advisory"
        model_name = "gemini-1.5-flash"
        field_id = context.get("field_id", "Unknown")
        start_time = time.time()
        
        if settings.TERRAPULSE_DEMO_MODE:
            latency = (time.time() - start_time) * 1000
            fallback = cls._get_advisory_fallback(context)
            AIAuditor.log_operation(model_name, feature, field_id, "v1_advisory", latency, True)
            return fallback

        cls._initialize()
        try:
            model = genai.GenerativeModel(model_name)
            prompt = f"""You are the TerraPulse AI Senior Agronomist. Generate a structured farm advisory based on this field context:

FIELD CONTEXT:
- Field Selected: {context.get('fieldName', 'West Field')}
- Crop: {context.get('crop', 'Cotton')}
- Crop Stage: {context.get('cropStage', 'Flowering')}
- Acreage: {context.get('acres', 12)} acres
- Soil Type: {context.get('soilType', 'Black Clay')}
- Current NDVI index: {context.get('ndvi', 0.54)}
- NDVI Trend: {context.get('ndviTrend', 'Decreasing')}
- Current Soil Moisture: {context.get('moisture', 28)}%
- Temperature: {context.get('temperature', 34)}°C
- Rainfall: {context.get('rainfall', 'Low')}
- Weather Forecast: {context.get('forecast', 'Dry for next 5 days')}
- Recent Disease Observations: {context.get('diseases', 'None')}
- Previous Recommendations: {context.get('prevRecs', 'Improve irrigation frequency')}
- Recent Farmer Actions: {context.get('recentActions', 'None')}

You must return a JSON object conforming exactly to this structure:
{{
  "field_status": "detailed explanation of current health and vegetative state of the field",
  "risk_level": "LOW" or "MEDIUM" or "HIGH" or "CRITICAL",
  "primary_risk": "the main risk factor threatening the crop yield right now",
  "risk_factors": ["list of secondary risk factors"],
  "recommendations": [
    {{
      "action": "clear, direct action to take",
      "priority": "LOW" or "MEDIUM" or "HIGH" or "CRITICAL",
      "timeline": "time window to complete (e.g. Within 24 hours)",
      "reason": "why this is recommended based on the numbers",
      "expected_benefit": "what the farmer will achieve by doing this"
    }}
  ],
  "water_guidance": "specific irrigation instructions grounded in soil moisture and forecast numbers",
  "soil_guidance": "soil management recommendations matching this soil type",
  "crop_guidance": "crop growth stage maintenance guidelines",
  "disease_guidance": "preventive or curative plant disease shielding steps",
  "regenerative_practice": "recommended cover crop or zero-tillage step to implement",
  "explanation": "general agronomic summary connecting the observations"
}}

Strict rules:
1. Return ONLY the raw JSON block. No markdown wrapper (like ```json), no explaining text.
2. EXPLAIN RECOMMENDATIONS USING ACTUAL NUMERICAL OBSERVATIONS provided in the context (NDVI, NDVI change, temperature, rainfall, soil moisture).
3. Do NOT invent, guess, or change any of the satellite or weather measurements. If a number is missing, discuss only the numbers present.
"""
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
            latency = (time.time() - start_time) * 1000
            data = json.loads(response.text.strip())
            
            # Map backward compatibility fields
            data["advisory"] = data["explanation"]
            # Simple conversion of risk level to numerical score if needed
            risk_map = {"LOW": 20, "MEDIUM": 50, "HIGH": 75, "CRITICAL": 90}
            data["riskScore"] = risk_map.get(data["risk_level"], 50)
            data["riskStatus"] = data["risk_level"]
            data["dataSource"] = "LIVE — Gemini Advisor"
            
            AIAuditor.log_operation(model_name, feature, field_id, "v1_advisory", latency, True)
            return data
        except Exception as e:
            latency = (time.time() - start_time) * 1000
            logger.error(f"Gemini advisory generation failed: {e}. Using fallback.")
            AIAuditor.log_operation(model_name, feature, field_id, "v1_advisory", latency, False, str(e))
            fallback = cls._get_advisory_fallback(context)
            fallback["dataSource"] = "DEMO — Gemini Fallback"
            return fallback

    @classmethod
    def generate_rotation_comparison(cls, computed: dict) -> dict:
        feature = "carbon_rotation_compare"
        model_name = "gemini-1.5-flash"
        start_time = time.time()
        
        if settings.TERRAPULSE_DEMO_MODE:
            latency = (time.time() - start_time) * 1000
            fallback = cls._get_rotation_fallback(computed)
            AIAuditor.log_operation(model_name, feature, "All", "v1_carbon_compare", latency, True)
            return fallback

        cls._initialize()
        try:
            model = genai.GenerativeModel(model_name)
            
            prompt = f"""You are a regenerative agriculture analyst. Review these computed carbon rotation scenarios:

ROTATION METRICS:
- Scenario A (Current Practice):
  * Projected Soil Organic Carbon (SOC): {computed['scenarioA']['socProjected']}% (current is {computed['scenarioA']['socCurrent']}%)
  * Sequestration Rate: {computed['scenarioA']['sequestrationRate']} tCO2e/ac/yr
  * Total Sequestration: {computed['scenarioA']['totalSequestration']} tCO2e/yr
  * Annual Carbon Credits: {computed['scenarioA']['annualCredits']} credits/yr
  * Water Demand Proxy: {computed['scenarioA']['waterDemand']}
  * Resilience Score: {computed['scenarioA']['resilience']}/100
  * Expected Yield: {computed['scenarioA']['yieldDirection']}

- Scenario B (Regenerative Rotation):
  * Projected SOC: {computed['scenarioB']['socProjected']}%
  * Sequestration Rate: {computed['scenarioB']['sequestrationRate']} tCO2e/ac/yr
  * Total Sequestration: {computed['scenarioB']['totalSequestration']} tCO2e/yr
  * Annual Carbon Credits: {computed['scenarioB']['annualCredits']} credits/yr
  * Water Demand Proxy: {computed['scenarioB']['waterDemand']}
  * Resilience Score: {computed['scenarioB']['resilience']}/100
  * Expected Yield: {computed['scenarioB']['yieldDirection']}

- Scenario C (Water-Efficient Rotation):
  * Projected SOC: {computed['scenarioC']['socProjected']}%
  * Sequestration Rate: {computed['scenarioC']['sequestrationRate']} tCO2e/ac/yr
  * Total Sequestration: {computed['scenarioC']['totalSequestration']} tCO2e/yr
  * Annual Carbon Credits: {computed['scenarioC']['annualCredits']} credits/yr
  * Water Demand Proxy: {computed['scenarioC']['waterDemand']}
  * Resilience Score: {computed['scenarioC']['resilience']}/100
  * Expected Yield: {computed['scenarioC']['yieldDirection']}

You must return a JSON object conforming exactly to this structure:
{{
  "recommended_strategy": "Name of recommended scenario (A or B or C)",
  "why": "specific reasons pointing to the metrics (e.g. SOC increases, carbon credit yields)",
  "trade_offs": "what the farmer must compromise (e.g. higher cover crop seed cost vs lower water demand)",
  "timeline": "3-year step-by-step practical timeline to implement the recommended rotation"
}}

Strict rules:
1. Return ONLY the raw JSON block. No markdown wrapper (like ```json), no explaining text.
2. Focus entirely on explaining why the recommended strategy is best based on the provided numbers.
3. Do NOT invent, guess, or modify the numerical calculations. The numbers are owned by the deterministic engine.
"""
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
            latency = (time.time() - start_time) * 1000
            data = json.loads(response.text.strip())
            AIAuditor.log_operation(model_name, feature, "All", "v1_carbon_compare", latency, True)
            return data
        except Exception as e:
            latency = (time.time() - start_time) * 1000
            logger.error(f"Gemini carbon rotation comparison failed: {e}. Using fallback.")
            AIAuditor.log_operation(model_name, feature, "All", "v1_carbon_compare", latency, False, str(e))
            return cls._get_rotation_fallback(computed)

    @classmethod
    def generate_copilot_response(cls, messages: list, context: dict) -> str:
        feature = "copilot_chat"
        model_name = "gemini-1.5-flash"
        field_id = context.get("fieldName", "Unknown")
        start_time = time.time()
        
        if settings.TERRAPULSE_DEMO_MODE:
            latency = (time.time() - start_time) * 1000
            fallback = cls._get_copilot_chat_fallback(messages, context)
            AIAuditor.log_operation(model_name, feature, field_id, "v1_copilot", latency, True)
            return fallback

        cls._initialize()
        try:
            system_instructions = f"""You are the TerraPulse AI Farm Copilot, a senior Indian agricultural expert.
Use the following strict field context to answer the user's question.

FIELD CONTEXT:
- Farm Name: {context.get('farmName', 'Green Valley Farm')}
- Field Selected: {context.get('fieldName', 'West Field')}
- Current Crop: {context.get('crop', 'Cotton')}
- Crop Stage: {context.get('cropStage', 'Flowering')}
- Soil Type: {context.get('soilType', 'Black Clay')}
- Acreage: {context.get('acres', 12)} ac
- Location: {context.get('location', 'Pune, Maharashtra')}
- Current NDVI: {context.get('ndvi', 0.54)}
- NDVI Trend: {context.get('ndviTrend', 'Decreasing')}
- Current Soil Moisture: {context.get('moisture', 28)}%
- Temperature: {context.get('temperature', 34)}°C
- Current Rainfall: {context.get('rainfall', 'Low')}
- Weather Forecast: {context.get('forecast', 'Dry for next 5 days')}
- Active Disease Observations: {context.get('diseases', 'None')}

STRICT RULES:
1. NEVER invent or hallucinate measurements. Rely only on the numbers above.
2. If the user asks a question, answer with:
   - OBSERVED: (observed values and trends from context)
   - INFERRED: (your agronomic reasoning and inferences)
   - RECOMMENDED: (action and urgency)
3. Keep it farmer-friendly and highly practical.
"""
            model = genai.GenerativeModel(model_name)
            contents = [{"role": "user", "parts": [system_instructions]}]
            for msg in messages:
                contents.append({
                    "role": "user" if msg["role"] == "user" else "model",
                    "parts": [msg["content"]]
                })

            response = model.generate_content(contents)
            latency = (time.time() - start_time) * 1000
            AIAuditor.log_operation(model_name, feature, field_id, "v1_copilot", latency, True)
            return response.text
        except Exception as e:
            latency = (time.time() - start_time) * 1000
            logger.error(f"Gemini copilot chat failed: {e}. Using fallback.")
            AIAuditor.log_operation(model_name, feature, field_id, "v1_copilot", latency, False, str(e))
            return cls._get_copilot_chat_fallback(messages, context)

    @classmethod
    def generate_content(cls, prompt: str) -> str:
        # Check if in Demo Mode and return high-fidelity dynamic fallbacks
        if settings.TERRAPULSE_DEMO_MODE:
            return cls._get_unstructured_fallback(prompt)

        cls._initialize()
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini unstructured content generation failed: {e}. Using fallback.")
            return cls._get_unstructured_fallback(prompt)

    @staticmethod
    def _get_unstructured_fallback(prompt: str) -> str:
        prompt_lower = prompt.lower()
        
        # 1. NDVI Change Explanation fallback
        if "ndvi change" in prompt_lower or "satellite crop analyst" in prompt_lower:
            # Parse parameters with defaults
            crop = "Cotton"
            for c in ["cotton", "wheat", "soybean", "maize", "rice"]:
                if c in prompt_lower:
                    crop = c.capitalize()
                    break
            
            # Find change percentage
            change_match = re.search(r"change of\s+([-+]?\d+\.?\d*)\%", prompt)
            change_val = float(change_match.group(1)) if change_match else -15.0
            
            moisture_match = re.search(r"moisture:\s*(\d+\.?\d*)\%", prompt_lower)
            moisture_val = float(moisture_match.group(1)) if moisture_match else 28.0
            
            temp_match = re.search(r"temp:\s*(\d+\.?\d*)", prompt_lower)
            temp_val = float(temp_match.group(1)) if temp_match else 34.0
            
            if change_val < 0:
                return (
                    f"OBSERVED SATELLITE FACTS:\n"
                    f"- NDVI decreased by {abs(change_val):.1f}% due to active vegetative stress.\n"
                    f"- Soil moisture ({moisture_val}%) and temperature ({temp_val}°C) indicate drying conditions.\n\n"
                    f"AI-INFERRED CAUSES:\n"
                    f"- High thermal stress combined with water depletion is accelerating chlorophyll degradation in the {crop} canopy."
                )
            else:
                return (
                    f"OBSERVED SATELLITE FACTS:\n"
                    f"- NDVI increased by {change_val:.1f}%, indicating active vegetative growth.\n"
                    f"- Soil moisture is stable at {moisture_val}% under {temp_val}°C conditions.\n\n"
                    f"AI-INFERRED CAUSES:\n"
                    f"- Stable chlorophyll absorption is confirmed for the {crop} canopy. Photosynthetic activity remains healthy."
                )
                
        # 2. Risk score explanation fallback
        if "risk score of" in prompt_lower or "risk analyst" in prompt_lower:
            # Find score and status
            score_match = re.search(r"score of\s*(\d+\.?\d*)/100", prompt_lower)
            score = float(score_match.group(1)) if score_match else 60.0
            
            status = "MEDIUM"
            for st in ["low", "medium", "high", "critical"]:
                if st in prompt_lower:
                    status = st.upper()
                    break
                    
            crop = "Cotton"
            for c in ["cotton", "wheat", "soybean", "maize", "rice"]:
                if c in prompt_lower:
                    crop = c.capitalize()
                    break
                    
            moisture_match = re.search(r"moisture:\s*(\d+\.?\d*)%", prompt_lower)
            moisture = float(moisture_match.group(1)) if moisture_match else 28.0
            
            return (
                f"The agricultural risk is rated {status} ({score}/100) for this {crop} parcel due to:\n"
                f"- Soil moisture levels at {moisture}% being below the recommended 35% baseline.\n"
                f"- Negative trends in the vegetation index showing localized stress.\n"
                f"Immediate sprinkler cycles are recommended to stabilize crop vigor."
            )
            
        return "Standard agronomic monitoring is active. Soil moisture and NDVI parameters are within normal baseline fluctuations."

    # --- FALLBACK GENERATORS ---

    @staticmethod
    def _get_plant_vision_fallback(crop: str) -> dict:
        if "wheat" in crop.lower():
            return {
                "diagnosis": "Wheat Brown Rust (Puccinia recondita)",
                "confidence": 0.88,
                "severity": "moderate",
                "symptoms": ["Orange-brown pustules on leaf surface", "Chlorosis surrounding pustules"],
                "possible_causes": ["High humidity", "Cooler night temperatures followed by warm days"],
                "immediate_actions": ["Apply Propiconazole 25% EC @ 2ml/liter", "Isolate heavily affected sectors"],
                "prevention": ["Use rust-resistant varieties", "Avoid late sowing"],
                "field_inspection_required": True,
                "disclaimer": "AI-assisted agricultural guidance (Demo Mode)"
            }
        else:
            return {
                "diagnosis": "Cotton Alternaria Leaf Spot",
                "confidence": 0.85,
                "severity": "moderate",
                "symptoms": ["Brown circular spots with concentric rings", "Dry, cracked spots falling out"],
                "possible_causes": ["Frequent rainfall", "High relative humidity in the lower canopy"],
                "immediate_actions": ["Spray Copper Oxychloride 50 WP @ 3g/liter or Mancozeb @ 2.5g/liter"],
                "prevention": ["Crop rotation with cereals", "Ensure balanced potassium fertilization"],
                "field_inspection_required": True,
                "disclaimer": "AI-assisted agricultural guidance (Demo Mode)"
            }

    @staticmethod
    def _get_soil_vision_fallback() -> dict:
        return {
            "soil_condition": "Clay loam structure with noticeable surface dryness, light compaction cracks, and crumbly aggregates.",
            "degradation_indicators": ["Slight wind erosion crusting", "Moderate cracking from dehydration"],
            "compaction_indicators": ["Subsurface soil consolidation limit indicated by spacing of dry surface cracks"],
            "organic_matter_clues": "Light greyish-brown shade indicating low-to-medium organic carbon levels (~0.45% SOC estimate).",
            "nutrient_stress_clues": ["Stunted nearby crop residues showing signs of nitrogen depletion (chlorotic base leaves)"],
            "recommended_tests": ["Standard chemical soil profile (N-P-K, pH, EC)", "Walkley-Black Organic Carbon test", "Bulk Density compaction test"],
            "regenerative_practices": ["Plant Daikon Radish cover crops as a biological subsoil drill", "Apply composted farmyard manure @ 5 tons/acre", "Adopt no-tillage or zero-tillage sowing"],
            "disclaimer": "Visual estimation only. This tool does not replace a wet-lab chemical soil test."
        }

    @staticmethod
    def _get_advisory_fallback(context: dict) -> dict:
        ndvi = context.get("ndvi", 0.54)
        moisture = context.get("moisture", 28)
        crop = context.get("crop", "Cotton")
        
        risk_level = "MEDIUM"
        if ndvi < 0.45 or moisture < 20:
            risk_level = "HIGH"
        elif ndvi < 0.35 or moisture < 15:
            risk_level = "CRITICAL"
            
        return {
            "field_status": f"The {context.get('fieldName', 'West Field')} is showing signs of moisture depletion. Vegetative vigor (NDVI) is at {ndvi} with a declining trend.",
            "risk_level": risk_level,
            "primary_risk": "Water stress & early stage wilt risk",
            "risk_factors": ["Dehydrated soil profile (moisture is at 28%)", "Transpiration increase from 34°C temperatures"],
            "recommendations": [
                {
                    "action": "Apply a light 12mm sprinkler cycle to the West Field",
                    "priority": "HIGH",
                    "timeline": "Within 24 hours",
                    "reason": f"Ground soil moisture (28%) is below the optimal 35% threshold for {crop}.",
                    "expected_benefit": "Restores leaf turgor pressure and stabilizes the declining NDVI vigor trend."
                },
                {
                    "action": "Mulch the crop beds with available dry crop residue",
                    "priority": "MEDIUM",
                    "timeline": "Within 3 days",
                    "reason": "Reduces moisture evaporation rate from soil surface in hot 34°C conditions.",
                    "expected_benefit": "Retains soil moisture up to 30% longer between watering intervals."
                }
            ],
            "water_guidance": "Implement alternate wetting and drying. Avoid over-watering to prevent clay root suffocation.",
            "soil_guidance": f"Apply organic mulch to Vertisol soil to prevent hard cracking under 34°C sunshine.",
            "crop_guidance": f"Monitor {crop} square/flower retention. Drought stress during flowering reduces boll yield.",
            "disease_guidance": "Keep foliage dry during irrigation. Higher relative humidity increases risk of fungal leaf spot.",
            "regenerative_practice": "Plant a deep-rooted legume cover crop (e.g. Cowpea) in the next cycle to enhance moisture retention.",
            "explanation": f"Advisory generated: Crop vegetative index is {ndvi}. Ground moisture is {moisture}%. Risk level is {risk_level} due to lack of immediate rainfall.",
            "advisory": f"Crop vegetative index is {ndvi}. Ground moisture is {moisture}%. Risk level is {risk_level} due to lack of immediate rainfall.",
            "riskScore": 65 if risk_level == "HIGH" else 45,
            "riskStatus": risk_level
        }

    @staticmethod
    def _get_rotation_fallback(computed: dict) -> dict:
        return {
            "recommended_strategy": "Scenario B (Regenerative Rotation)",
            "why": f"Scenario B achieves the highest projected Soil Organic Carbon (SOC) increase (from {computed['scenarioA']['socCurrent']}% to {computed['scenarioB']['socProjected']}%) and yields {computed['scenarioB']['annualCredits']} carbon credits per year, which is 20% higher than the baseline.",
            "trade_offs": "Requires an upfront investment in cover crop seeds and initial management costs, but reduces long-term chemical nitrogen dependency.",
            "timeline": "Year 1: Plant cover crops (Sunn Hemp) post-harvest. Year 2: Reduce tillage to preserve fungal networks. Year 3: Localized compost applications."
        }

    @staticmethod
    def _get_copilot_chat_fallback(messages: list, context: dict) -> str:
        last_msg = messages[-1]["content"].lower() if messages else ""
        crop = context.get("crop", "Cotton")
        ndvi = context.get("ndvi", 0.54)
        moisture = context.get("moisture", 28)
        
        if "disease" in last_msg or "rust" in last_msg or "spot" in last_msg:
            return f"""OBSERVED:
- Crop: {crop}
- Leaf Symptoms: Spotting observed on some leaves in the lower canopy.

INFERRED:
- Fungal spores can germinate quickly when relative humidity stays high under high temperatures (34°C).

RECOMMENDED:
- Spray Copper Oxychloride @ 3g/liter or use neem seed kernel extract for organic shielding. Check foliage dryness. Urgency: Moderate."""
            
        elif "irrigate" in last_msg or "water" in last_msg or "dry" in last_msg:
            return f"""OBSERVED:
- Soil moisture: {moisture}% (Optimal range is 35-50% for this crop stage)
- Weather forecast: Dry for next 5 days

INFERRED:
- The crop is currently drawing moisture from deep root reservoirs, but this is depleting quickly and starting to impact the vegetation index ({ndvi}).

RECOMMENDED:
- Run a 12mm sprinkler cycle in the {context.get('fieldName', 'West Field')} within the next 24 hours. Urgency: High."""
            
        else:
            return f"""OBSERVED:
- Crop: {crop} ({context.get('cropStage', 'Flowering')})
- NDVI vigor: {ndvi}
- Moisture levels: {moisture}%

INFERRED:
- The crop requires balanced nutrition and active moisture monitoring during this critical flowering stage.

RECOMMENDED:
- Irrigate to keep moisture above 30%, and apply organic compost in active zones. Urgency: Watchful."""
