"""Price Prediction Router"""
from fastapi import APIRouter
router = APIRouter()

@router.post("/predict")
async def predict_price():
    return {"message": "Price prediction - to be implemented"}
