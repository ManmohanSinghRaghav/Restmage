"""Maps Router"""
from fastapi import APIRouter
router = APIRouter()

@router.get("/location")
async def get_location():
    return {"message": "Maps - to be implemented"}
