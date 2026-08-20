import base64
import time
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.schemas.voice import STTResponse, TTSResponse, TTSRequest, VoiceAdviceRequest, VoiceAdviceResponse
from app.services.speech_service import SpeechService
from app.services.firestore_service import FirestoreService
from app.services.gemini_service import GeminiService
from app.config import settings

router = APIRouter(tags=["Multilingual Voice Assistant"])

@router.post("/voice/transcribe", response_model=STTResponse)
async def voice_transcribe(audio: UploadFile = File(...), language: str = Form("en-IN")):
    try:
        content = await audio.read()
        transcript = SpeechService.speech_to_text(content, language)
        source = "demo" if settings.TERRAPULSE_DEMO_MODE else "live"
        return {"transcript": transcript, "source": source}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/voice/speak", response_model=TTSResponse)
async def voice_speak(req: TTSRequest):
    try:
        res = SpeechService.text_to_speech(req.text, req.language)
        source = "demo" if settings.TERRAPULSE_DEMO_MODE else "live"
        return {
            "audioContent": res.get("audioContent", ""),
            "fallback": res.get("fallback", True),
            "source": source
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/voice/advice", response_model=VoiceAdviceResponse)
async def voice_advice(req: VoiceAdviceRequest):
    try:
        transcript = ""
        source = "demo" if settings.TERRAPULSE_DEMO_MODE else "live"
        
        # 1. Speech-to-Text if base64 audio is provided
        if req.audio_base64:
            audio_bytes = base64.b64decode(req.audio_base64)
            transcript = SpeechService.speech_to_text(audio_bytes, req.language)
        else:
            transcript = req.text_query or ""
            
        if not transcript:
            raise HTTPException(status_code=400, detail="Either audio_base64 or text_query must be provided")

        # 2. Gather Field Context
        field = FirestoreService.get_field(req.field_id) or {
            "id": req.field_id,
            "fieldName": "West Field",
            "crop": "Cotton",
            "cropStage": "Flowering",
            "ndvi": 0.54,
            "moisture": 28,
            "temperature": 34,
            "soilType": "Black Clay",
            "location": "Pune, Maharashtra"
        }
        
        # 3. Localized Gemini agricultural reasoning
        lang_instructions = {
            "hi-IN": "Respond strictly in simple Hindi (using Devanagari script).",
            "mr-IN": "Respond strictly in simple Marathi (using Devanagari script).",
            "kn-IN": "Respond strictly in simple Kannada (using Kannada script).",
            "en-IN": "Respond strictly in simple English."
        }
        instruction = lang_instructions.get(req.language, "Respond strictly in simple English.")
        
        prompt = f"""You are the TerraPulse Multilingual voice assistant. A farmer asks: '{transcript}'
Field Context:
- Crop: {field.get('crop')} ({field.get('cropStage')})
- NDVI vegetative vigor: {field.get('ndvi')}
- Soil Moisture: {field.get('moisture')}%
- Temperature: {field.get('temperature')}°C
- Location: {field.get('location')}

Instruction:
1. Answer the question in simple, farmer-friendly terms based on the context.
2. {instruction}
3. Keep the reply short (max 2-3 sentences) suitable for text-to-speech output.
"""
        reply = GeminiService.generate_content(prompt)
        
        # 4. Text-to-Speech translation output
        tts_res = SpeechService.text_to_speech(reply, req.language)
        
        return {
            "transcript": transcript,
            "reply": reply,
            "audioContent": tts_res.get("audioContent", ""),
            "language": req.language,
            "source": source
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
