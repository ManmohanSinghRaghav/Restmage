"""
Minimal test endpoint to debug Vercel deployment
"""
from fastapi import FastAPI
from fastapi.responses import JSONResponse
import sys
import os

app = FastAPI()

@app.get("/")
async def root():
    return {
        "status": "working",
        "message": "Minimal FastAPI test",
        "python_version": sys.version,
        "env": os.environ.get("ENVIRONMENT", "not set")
    }

@app.get("/test")
async def test():
    return {"test": "ok"}
