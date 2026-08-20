import time
import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.utils.logging import log_request_middleware
from app.routers import (
    health,
    dashboard,
    farms,
    fields,
    satellite,
    scanner,
    advisory,
    simulator,
    voice,
    cooperative,
    copilot,
    actions
)

# Configure base logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TerraPulseBackend")

def create_app() -> FastAPI:
    app = FastAPI(
        title="TerraPulse AI Agronomic Intelligence Backend",
        description="Production-ready FastAPI backend for TerraPulse AI agricultural advisory system.",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc"
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Centralized Request Logging Middleware
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        return await log_request_middleware(request, call_next)

    # Centralized Exception Handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Global unhandled exception on {request.url.path}: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred. Please try again later."
                }
            }
        )

    # Include Versioned Routers under /api/v1
    app.include_router(health.router, prefix="/api/v1")
    app.include_router(dashboard.router, prefix="/api/v1")
    app.include_router(farms.router, prefix="/api/v1")
    app.include_router(fields.router, prefix="/api/v1")
    app.include_router(satellite.router, prefix="/api/v1")
    app.include_router(scanner.router, prefix="/api/v1")
    app.include_router(advisory.router, prefix="/api/v1")
    app.include_router(simulator.router, prefix="/api/v1")
    app.include_router(voice.router, prefix="/api/v1")
    app.include_router(cooperative.router, prefix="/api/v1")
    app.include_router(copilot.router, prefix="/api/v1")
    app.include_router(actions.router, prefix="/api/v1")

    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting server on port {settings.PORT}...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
