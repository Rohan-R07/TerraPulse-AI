from pydantic import BaseModel
from typing import Optional

class STTResponse(BaseModel):
    transcript: str
    source: str = "demo"

class VoiceAdviceRequest(BaseModel):
    field_id: str
    text_query: Optional[str] = None
    audio_base64: Optional[str] = None
    language: str = "en-IN"

class VoiceAdviceResponse(BaseModel):
    transcript: str
    reply: str
    audioContent: str  # Base64 encoded audio
    language: str
    source: str = "demo"

class TTSRequest(BaseModel):
    text: str
    language: str = "en-IN"

class TTSResponse(BaseModel):
    audioContent: str
    fallback: Optional[bool] = False
    source: str = "demo"
