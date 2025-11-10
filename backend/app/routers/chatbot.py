"""Chatbot Router"""
from fastapi import APIRouter
router = APIRouter()

@router.post("/message")
async def chatbot_message():
    return {"message": "Chatbot - to be implemented"}
