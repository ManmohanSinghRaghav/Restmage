"""
FastAPI Main Application
Restmage - Real Estate Map Generator Backend
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import uvicorn
from datetime import datetime
import os

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.routers import auth, projects, cost, maps, export_routes, floorplan, price_prediction, chatbot, gemini, predictor
from app.middleware.logging_middleware import LoggingMiddleware
from app.services.ml_service import ml_service

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI app
app = FastAPI(
    title="Restmage API",
    description="Real Estate Map Generator - Floor plan generation and cost estimation",
    version="2.0.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else "/api/docs",
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else "/api/redoc",
    openapi_url="/openapi.json" if settings.ENVIRONMENT != "production" else "/api/openapi.json",
    # Enable docs in production
    swagger_ui_parameters={"displayRequestDuration": True, "filter": True}
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Security middleware
if settings.ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS
    )

# Custom logging middleware
app.add_middleware(LoggingMiddleware)

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize database connection and ML service on startup"""
    try:
        await connect_to_mongo()
        print("✅ Database connection established")
    except Exception as e:
        print(f"⚠️  Database connection failed: {e}")
        # Don't fail startup - some endpoints may still work
    
    # Load ML model
    try:
        if ml_service.load_model():
            print("✅ ML model loaded successfully")
        else:
            print("⚠️  ML model not found - using fallback heuristic model")
    except Exception as e:
        print(f"⚠️  ML model loading failed: {e}")
    
    print(f"� Restmage API started")
    print(f"🌍 Environment: {settings.ENVIRONMENT}")

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    try:
        await close_mongo_connection()
        print("👋 Database connection closed")
    except Exception as e:
        print(f"⚠️  Error closing database: {e}")

# Health check endpoint
@app.get("/api/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint
    Returns server status and timestamp
    """
    return {
        "status": "OK",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0",
        "environment": settings.ENVIRONMENT
    }

# Root endpoint
@app.get("/", tags=["Root"])
async def root(request: Request):
    """Root endpoint with API information"""
    base_url = str(request.base_url).rstrip('/')
    return {
        "message": "Restmage API v2.0 - FastAPI Backend",
        "status": "running",
        "docs": f"{base_url}/api/docs",
        "redoc": f"{base_url}/api/redoc",
        "health": f"{base_url}/api/health",
        "version": "2.0.0",
        "environment": settings.ENVIRONMENT
    }

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(cost.router, prefix="/api/cost", tags=["Cost Estimation"])
app.include_router(maps.router, prefix="/api/maps", tags=["Maps"])
app.include_router(export_routes.router, prefix="/api/export", tags=["Export"])
app.include_router(floorplan.router, prefix="/api/floorplan", tags=["Floor Plans"])
app.include_router(price_prediction.router, prefix="/api/price-prediction", tags=["Price Prediction"])
app.include_router(predictor.router, prefix="/api", tags=["ML Price Predictor"])  # New ML predictor
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["Chatbot"])
app.include_router(gemini.router, prefix="/api/gemini", tags=["AI Generation"])

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all uncaught exceptions"""
    return JSONResponse(
        status_code=500,
        content={
            "message": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "An unexpected error occurred"
        }
    )

# Run with uvicorn if executed directly
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
