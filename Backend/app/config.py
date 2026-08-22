import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(override=True)

class Settings(BaseModel):
    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "AIzaSyDXLC-VuQZuFXowORsslcSNb79UhncYy7k")
    OPENROUTER_API_KEY: str = os.environ.get("OPENROUTER_API_KEY", "")
    HF_TOKEN: str = os.environ.get("HF_TOKEN", "hf_ZYzxuXEE0OcxqoyGRvKCiNElEpDPzSiCBx")
    TERRAPULSE_DEMO_MODE: bool = os.environ.get("TERRAPULSE_DEMO_MODE", "false").lower() in ("true", "1", "yes")
    FIREBASE_SERVICE_ACCOUNT: str = os.environ.get("FIREBASE_SERVICE_ACCOUNT", "")
    PROJECT_ID: str = os.environ.get("PROJECT_ID", "terrapulse-ai")
    MONGODB_URI: str = os.environ.get("MONGODB_URI", "")
    PORT: int = int(os.environ.get("PORT", "8000"))

settings = Settings()

