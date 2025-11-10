"""Floor Plan Router"""
from fastapi import APIRouter
router = APIRouter()

@router.post("/generate")
async def generate_floorplan():
    return {"message": "Floor plan generation - to be implemented"}
