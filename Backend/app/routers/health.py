import time
from fastapi import APIRouter
from app.config import settings

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
async def get_health():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "demoMode": settings.TERRAPULSE_DEMO_MODE
    }
