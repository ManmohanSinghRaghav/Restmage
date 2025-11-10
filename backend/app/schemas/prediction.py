"""
Pydantic schemas for price prediction requests and responses.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
from datetime import datetime


class PropertyFeatures(BaseModel):
    """Property features for prediction."""
    
    area: float = Field(..., description="Property area in square feet", gt=0)
    bedrooms: int = Field(..., description="Number of bedrooms", ge=0)
    bathrooms: int = Field(..., description="Number of bathrooms", ge=0)
    floors: int = Field(default=1, description="Number of floors", ge=1)
    yearBuilt: Optional[int] = Field(None, description="Year the property was built")
    age: Optional[int] = Field(None, description="Age of property in years (alternative to yearBuilt)")
    location: Optional[str] = Field(None, description="Location type: Urban, Suburban, Rural")
    condition: Optional[str] = Field(None, description="Property condition: Excellent, Good, Fair, Poor")
    garage: Optional[bool] = Field(None, description="Has garage (Yes/No or True/False)")
    amenities: List[str] = Field(default=[], description="List of amenities (garage, pool, garden, etc.)")
    
    @field_validator('location')
    @classmethod
    def validate_location(cls, v):
        """Validate location is one of the accepted values."""
        if v is not None:
            valid_locations = ['urban', 'suburban', 'rural']
            if v.lower() not in valid_locations:
                # Allow it but warn
                pass
        return v
    
    @field_validator('condition')
    @classmethod
    def validate_condition(cls, v):
        """Validate condition is one of the accepted values."""
        if v is not None:
            valid_conditions = ['excellent', 'good', 'fair', 'poor']
            if v.lower() not in valid_conditions:
                # Allow it but warn
                pass
        return v
    
    @field_validator('yearBuilt')
    @classmethod
    def validate_year_built(cls, v):
        """Validate yearBuilt is reasonable."""
        if v is not None:
            current_year = datetime.now().year
            if v < 1800 or v > current_year + 5:
                raise ValueError(f"yearBuilt must be between 1800 and {current_year + 5}")
        return v
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "area": 2000,
                "bedrooms": 3,
                "bathrooms": 2,
                "floors": 2,
                "yearBuilt": 2010,
                "location": "Urban",
                "condition": "Good",
                "garage": True,
                "amenities": ["garage", "garden"]
            }
        }
    }


class PredictionRequest(BaseModel):
    """Request model for single prediction."""
    
    features: PropertyFeatures = Field(..., description="Property features")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "features": {
                    "area": 2000,
                    "bedrooms": 3,
                    "bathrooms": 2,
                    "floors": 2,
                    "yearBuilt": 2010,
                    "location": "Urban",
                    "condition": "Good",
                    "garage": True,
                    "amenities": ["garage", "garden"]
                }
            }
        }
    }


class PriceRange(BaseModel):
    """Price range model."""
    
    min: int = Field(..., description="Minimum price in currency")
    max: int = Field(..., description="Maximum price in currency")


class PriceBreakdown(BaseModel):
    """Breakdown of price components."""
    
    basePrice: Optional[int] = Field(None, description="Base price")
    areaContribution: Optional[int] = Field(None, description="Contribution from area")
    bedroomContribution: Optional[int] = Field(None, description="Contribution from bedrooms")
    bathroomContribution: Optional[int] = Field(None, description="Contribution from bathrooms")
    floorsContribution: Optional[int] = Field(None, description="Contribution from floors")
    ageAdjustment: Optional[int] = Field(None, description="Adjustment for property age")
    locationPremium: Optional[int] = Field(None, description="Premium for location")
    conditionAdjustment: Optional[int] = Field(None, description="Adjustment for condition")
    garageContribution: Optional[int] = Field(None, description="Contribution from garage")
    otherAmenitiesContribution: Optional[int] = Field(None, description="Contribution from other amenities")


class PredictionResult(BaseModel):
    """Single prediction result."""
    
    estimatedPrice: int = Field(..., description="Estimated property price")
    priceRange: PriceRange = Field(..., description="Price range (min/max)")
    confidence: float = Field(..., description="Confidence level (0-1)", ge=0, le=1)
    breakdown: PriceBreakdown = Field(default_factory=lambda: PriceBreakdown(), description="Price breakdown")


class PredictionResponse(BaseModel):
    """Response model for single prediction."""
    
    success: bool = Field(..., description="Whether prediction was successful")
    prediction: PredictionResult = Field(..., description="Prediction results")
    inputFeatures: PropertyFeatures = Field(..., description="Input features used")
    modelUsed: str = Field(..., description="Model used: ml_model or heuristic")
    currency: str = Field(default="INR", description="Currency code")
    timestamp: str = Field(..., description="Prediction timestamp (ISO format)")
    disclaimer: str = Field(
        default="This is an estimated price based on general market trends. "
                "Actual prices may vary based on specific location and market conditions.",
        description="Disclaimer text"
    )


class BatchPredictionRequest(BaseModel):
    """Request model for batch prediction."""
    
    properties: List[PropertyFeatures] = Field(
        ..., 
        description="List of properties to predict",
        min_length=1,
        max_length=100
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "properties": [
                    {
                        "area": 2000,
                        "bedrooms": 3,
                        "bathrooms": 2,
                        "floors": 2,
                        "yearBuilt": 2010,
                        "location": "Urban",
                        "condition": "Good",
                        "garage": True
                    },
                    {
                        "area": 1500,
                        "bedrooms": 2,
                        "bathrooms": 1,
                        "floors": 1,
                        "yearBuilt": 2015,
                        "location": "Suburban",
                        "condition": "Excellent",
                        "garage": False
                    }
                ]
            }
        }
    }


class PropertyPrediction(BaseModel):
    """Single property prediction in batch results."""
    
    propertyId: int = Field(..., description="Property identifier in batch")
    features: PropertyFeatures = Field(..., description="Property features")
    prediction: PredictionResult = Field(..., description="Prediction results")


class BatchPredictionResponse(BaseModel):
    """Response model for batch prediction."""
    
    success: bool = Field(..., description="Whether batch prediction was successful")
    modelUsed: str = Field(..., description="Model used: ml_model or heuristic")
    predictions: List[PropertyPrediction] = Field(..., description="List of predictions")
    currency: str = Field(default="INR", description="Currency code")
    timestamp: str = Field(..., description="Prediction timestamp (ISO format)")
    disclaimer: str = Field(
        default="These are estimated prices based on general market trends. "
                "Actual prices may vary based on specific location and market conditions.",
        description="Disclaimer text"
    )


class MarketTrendsResponse(BaseModel):
    """Response model for market trends."""
    
    success: bool = Field(..., description="Whether request was successful")
    trends: Dict[str, Any] = Field(..., description="Market trend data")
    lastUpdated: str = Field(..., description="Last update timestamp (ISO format)")
    message: str = Field(default="", description="Additional information")
