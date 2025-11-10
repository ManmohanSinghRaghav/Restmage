"""Cost Estimation Router"""
from fastapi import APIRouter
router = APIRouter()

@router.post("/estimate")
async def estimate_cost():
    return {"message": "Cost estimation - to be implemented"}
