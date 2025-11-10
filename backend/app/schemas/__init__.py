"""Schemas module for request/response models."""
from .prediction import (
    PropertyFeatures,
    PredictionRequest,
    PredictionResponse,
    PriceBreakdown,
    PriceRange,
    BatchPredictionRequest,
    BatchPredictionResponse,
    PropertyPrediction,
    MarketTrendsResponse
)

__all__ = [
    "PropertyFeatures",
    "PredictionRequest",
    "PredictionResponse",
    "PriceBreakdown",
    "PriceRange",
    "BatchPredictionRequest",
    "BatchPredictionResponse",
    "PropertyPrediction",
    "MarketTrendsResponse"
]
