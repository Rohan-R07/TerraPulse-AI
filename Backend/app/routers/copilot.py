from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.services.gemini_service import GeminiService
from app.services.firestore_service import FirestoreService

from app.services.weather_service import WeatherService

router = APIRouter(tags=["Copilot & RAG"])

class ChatRequest(BaseModel):
    # Old contract
    messages: Optional[List[Dict[str, str]]] = None
    context: Optional[Dict[str, Any]] = None
    # New contract
    field_id: Optional[str] = None
    message: Optional[str] = None
    language: Optional[str] = "en"

class RagRequest(BaseModel):
    query: str
    crop: Optional[str] = None

@router.post("/copilot/chat")
async def copilot_chat(request: ChatRequest):
    # Determine which contract is being used
    if request.message is not None and request.field_id is not None:
        # New contract execution
        field = FirestoreService.get_field(request.field_id) or {
            "id": request.field_id,
            "fieldName": "West Field",
            "crop": "Cotton",
            "cropStage": "Flowering",
            "acres": 12.0,
            "soilType": "Black Clay",
            "ndvi": 0.54,
            "ndviTrend": "Decreasing",
            "moisture": 28.0,
            "temperature": 34.0,
            "location": "Pune, Maharashtra"
        }
        
        # Build messages and context structure
        messages_list = [{"role": "user", "content": request.message}]
        weather = WeatherService.get_live_weather(field.get("location", "Pune, Maharashtra"))
        context_dict = {
            "farmName": "Green Valley Farm",
            "fieldName": field.get("fieldName", "West Field"),
            "crop": field.get("crop", "Cotton"),
            "cropStage": field.get("cropStage", "Flowering"),
            "acres": field.get("acres", 12.0),
            "soilType": field.get("soilType", "Black Clay"),
            "location": field.get("location", "Pune, Maharashtra"),
            "ndvi": field.get("ndvi", 0.54),
            "ndviTrend": field.get("ndviTrend", "Decreasing"),
            "moisture": weather["moisture"],
            "temperature": weather["temp"],
            "rainfall": weather["rainfall"],
            "forecast": weather["forecast"],
            "diseases": "None"
        }
        
        response = GeminiService.generate_copilot_response(messages_list, context_dict)
        return {"response": response, "reply": response}
    
    elif request.messages is not None and request.context is not None:
        # Old contract execution
        response = GeminiService.generate_copilot_response(request.messages, request.context)
        return {"response": response}
        
    else:
        raise HTTPException(status_code=400, detail="Invalid request parameters. Must supply either ('messages' and 'context') or ('field_id' and 'message').")

# Mock RAG Knowledge Base Data (ICAR & Indian Govt guidelines)
KNOWLEDGE_BASE = [
    {
        "title": "ICAR Wheat Cultivation Guidelines for Indo-Gangetic Plains",
        "crop": "Wheat",
        "region": "Indo-Gangetic Plains",
        "content": "Sowing window for wheat is November 1 to November 25. Late sowing reduces yields by 1.5% per day. Recommended irrigation stages are: Crown Root Initiation (CRI) at 21 days (critical), Tillering at 40-45 days, Late jointing at 60-65 days, Flowering at 80-85 days, and Milking at 100-105 days. Zero-tillage conservation method increases SOC (Soil Organic Carbon) by 0.15% over 3 years and reduces irrigation demand by 20%."
    },
    {
        "title": "Regenerative Cover Cropping for Cotton in Maharashtra",
        "crop": "Cotton",
        "region": "Maharashtra / Deccan",
        "content": "Monsoon cotton sowing starts mid-June. Integrating Sunn Hemp (Crotalaria juncea) or Cowpea as a cover crop during fallow periods fixes up to 60 kg nitrogen per hectare. High-density planting system (HDPS) is recommended for rainfed vertisol soils. To prevent Pink Bollworm, use Bt Cotton seeds (Bollgard II), plant non-Bt border rows, and install pheromone traps at 5 per acre starting 45 days after sowing."
    },
    {
        "title": "Rice Paddy Water Management and Alternate Wetting & Drying (AWD)",
        "crop": "Rice",
        "region": "Karnataka & Telangana",
        "content": "AWD irrigation reduces methane emissions by 30-50% and water usage by 25% without yield penalty. Field water level should be monitored using a perforated field tube (pani pipe). Re-irrigate when water level drops to 15 cm below soil surface. For blast disease (Magnaporthe oryzae), apply biological controls like Pseudomonas fluorescens @ 10g/liter or spray Tricyclazole @ 0.6g/liter at onset."
    },
    {
        "title": "Soil Compaction and Cover Crop Solutions for Clay Soils",
        "crop": "All Crops",
        "region": "Pan-India",
        "content": "Deep clay soils (Vertisols) are highly prone to compaction, which restricts root growth and reduces water infiltration. Regenerative solution: Plant deep-taproot cover crops like Daikon Radish (Tillage Radish) or Alfalfa. These natural 'bio-drills' break through compacted subsurface layers, improving soil aeration, structure, and organic matter content."
    }
]

def retrieve_knowledge(query: str, crop: Optional[str] = None) -> str:
    results = []
    for doc in KNOWLEDGE_BASE:
        if crop and crop.lower() in doc["crop"].lower():
            results.append(doc)
        elif query.lower() in doc["content"].lower() or query.lower() in doc["title"].lower():
            results.append(doc)
            
    if not results:
        results = KNOWLEDGE_BASE[:2]
        
    context = ""
    for r in results:
        context += f"\nSource: {r['title']} (Region: {r['region']})\nContent: {r['content']}\n"
    return context

@router.post("/knowledge-rag")
async def query_knowledge_rag(request: RagRequest):
    try:
        context_chunks = retrieve_knowledge(request.query, request.crop)
        prompt = f"""You are a grounded agricultural AI advisor. You must answer the farmer's question based strictly on the retrieved resources from ICAR, government research, and verified crop guidelines.

RETIREVED KNOWLEDGE CONTEXT:
{context_chunks}

USER QUESTION: {request.query}

STRICT RULES:
1. Answer the user question clearly, relying ONLY on the retrieved guidelines.
2. If the retrieved context does not contain enough information to answer, state clearly: "I cannot find this in our verified guidelines." and do NOT fabricate answers.
3. Show the source title and region used for your answer at the bottom of the response.
"""
        answer = GeminiService.generate_content(prompt)
        return {
            "answer": answer,
            "sources": context_chunks,
            "dataSource": "LIVE — RAG Knowledge retrieval + Gemini"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
