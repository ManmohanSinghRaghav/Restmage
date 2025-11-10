"""Gemini AI Router"""
from fastapi import APIRouter
router = APIRouter()

@router.post("/generate")
async def gemini_generate():
    return {"message": "Gemini AI - to be implemented"}
