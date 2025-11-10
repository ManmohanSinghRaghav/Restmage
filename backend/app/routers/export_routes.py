"""Export Router"""
from fastapi import APIRouter
router = APIRouter()

@router.post("/pdf")
async def export_pdf():
    return {"message": "Export - to be implemented"}
