"""
Price Prediction API Routes.

This module provides endpoints for:
- Single property price prediction
- Batch property price prediction
- Market trends and insights
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any
import logging

from ..schemas.prediction import (
    PredictionRequest,
    PredictionResponse,
    BatchPredictionRequest,
    BatchPredictionResponse,
    MarketTrendsResponse,
    PropertyFeatures,
    PredictionResult,
    PropertyPrediction
)
from ..services.ml_service import ml_service
from ..core.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/predictor", tags=["Price Prediction"])


@router.post(
    "/predict",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict property price",
    description="Predict the price of a single property based on its features. "
                "Uses ML model if available, otherwise falls back to heuristic model."
)
async def predict_price(
    request: PredictionRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Predict property price based on features.
    
    **Required features:**
    - area: Property area in square feet (> 0)
    - bedrooms: Number of bedrooms (≥ 0)
    - bathrooms: Number of bathrooms (≥ 0)
    - floors: Number of floors (≥ 1, default: 1)
    - yearBuilt or age: Property age
    
    **Optional features:**
    - location: Urban, Suburban, or Rural
    - condition: Excellent, Good, Fair, or Poor
    - garage: Has garage (true/false)
    - amenities: List of amenities (garage, pool, garden, basement, balcony)
    
    **Returns:**
    - estimatedPrice: Predicted price in INR
    - priceRange: Min/max price range
    - confidence: Prediction confidence (0-1)
    - breakdown: Detailed price breakdown
    - modelUsed: Which model was used (ml_model or heuristic)
    """
    try:
        # Convert Pydantic model to dict
        features_dict = request.features.model_dump()
        
        # Validate required fields
        missing_fields = []
        if not features_dict.get('area'):
            missing_fields.append('area')
        if features_dict.get('bedrooms') is None:
            missing_fields.append('bedrooms')
        if features_dict.get('bathrooms') is None:
            missing_fields.append('bathrooms')
        
        # Must have either yearBuilt or age
        if not features_dict.get('yearBuilt') and features_dict.get('age') is None:
            missing_fields.append('yearBuilt or age')
        
        if missing_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "Required fields missing",
                    "missing": missing_fields,
                    "required": {
                        "area": "number (square feet, > 0)",
                        "bedrooms": "number (≥ 0)",
                        "bathrooms": "number (≥ 0)",
                        "floors": "number (≥ 1, default: 1)",
                        "yearBuilt": "number (year) OR age: number (years)",
                        "location": "string (optional: Urban, Suburban, Rural)",
                        "condition": "string (optional: Excellent, Good, Fair, Poor)",
                        "garage": "boolean (optional)",
                        "amenities": "array of strings (optional)"
                    }
                }
            )
        
        # Get prediction from ML service
        result = await ml_service.predict(features_dict)
        
        if not result.get('success'):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get('error', 'Prediction failed')
            )
        
        # Build response
        prediction_data = result['prediction']
        response = PredictionResponse(
            success=True,
            prediction=PredictionResult(**prediction_data),
            inputFeatures=request.features,
            modelUsed=result['modelUsed'],
            currency=result['currency'],
            timestamp=result['timestamp']
        )
        
        logger.info(f"Price prediction for user {current_user.get('id')}: "
                   f"${prediction_data['estimatedPrice']} using {result['modelUsed']}")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Price prediction error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to predict price: {str(e)}"
        )


@router.post(
    "/batch-predict",
    response_model=BatchPredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Batch predict property prices",
    description="Predict prices for multiple properties in a single request. "
                "Maximum 100 properties per request."
)
async def batch_predict_prices(
    request: BatchPredictionRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Predict prices for multiple properties.
    
    **Request body:**
    - properties: Array of property features (1-100 items)
    
    **Returns:**
    - predictions: Array of predictions with propertyId, features, and prediction results
    - modelUsed: Which model was used (ml_model or heuristic)
    - currency: Currency code (INR)
    """
    try:
        if not request.properties:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one property required for batch prediction"
            )
        
        if len(request.properties) > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 100 properties allowed per batch request"
            )
        
        # Convert to list of dicts
        properties_list = [prop.model_dump() for prop in request.properties]
        
        # Get batch predictions from ML service
        result = await ml_service.batch_predict(properties_list)
        
        if not result.get('success'):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get('error', 'Batch prediction failed')
            )
        
        # Build response
        predictions = []
        for pred_data in result['predictions']:
            predictions.append(
                PropertyPrediction(
                    propertyId=pred_data['propertyId'],
                    features=PropertyFeatures(**pred_data['features']),
                    prediction=PredictionResult(**pred_data['prediction'])
                )
            )
        
        response = BatchPredictionResponse(
            success=True,
            modelUsed=result['modelUsed'],
            predictions=predictions,
            currency=result['currency'],
            timestamp=result['timestamp']
        )
        
        logger.info(f"Batch prediction for user {current_user.get('id')}: "
                   f"{len(predictions)} properties using {result['modelUsed']}")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch prediction error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to predict prices: {str(e)}"
        )


@router.get(
    "/market-trends",
    response_model=MarketTrendsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get market trends",
    description="Get current real estate market trends including pricing factors, "
                "location premiums, and amenity values."
)
async def get_market_trends(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get current market trends and pricing insights.
    
    **Returns:**
    - trends: Market trend data including:
        - averagePricePerSqFt: Average price per square foot
        - locationPremiums: Price premiums by location type
        - conditionAdjustments: Price adjustments by property condition
        - amenityValues: Values of different amenities
    - lastUpdated: Last update timestamp
    """
    try:
        result = await ml_service.get_market_trends()
        
        response = MarketTrendsResponse(**result)
        
        logger.info(f"Market trends requested by user {current_user.get('id')}")
        
        return response
        
    except Exception as e:
        logger.error(f"Market trends error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve market trends: {str(e)}"
        )


@router.get(
    "/health",
    summary="Check predictor service health",
    description="Check if the ML predictor service is running and which model is available."
)
async def predictor_health():
    """
    Check predictor service health.
    
    **Returns:**
    - status: Service status (healthy/degraded)
    - mlModelLoaded: Whether ML model is loaded
    - modelPath: Path to ML model file
    - message: Status message
    """
    try:
        is_healthy = ml_service.model_loaded
        
        return {
            "status": "healthy" if is_healthy else "degraded",
            "mlModelLoaded": ml_service.model_loaded,
            "modelPath": ml_service.model_path,
            "message": "ML model loaded" if is_healthy else "Using fallback heuristic model"
        }
    except Exception as e:
        logger.error(f"Health check error: {e}", exc_info=True)
        return {
            "status": "error",
            "mlModelLoaded": False,
            "message": f"Health check failed: {str(e)}"
        }
