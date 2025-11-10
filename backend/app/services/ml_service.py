"""
ML Prediction Service for Real Estate Price Prediction.

This service provides:
- ML model-based predictions (scikit-learn)
- Fallback heuristic predictions when ML model unavailable
- Batch prediction support
- Feature preprocessing and validation
"""

import os
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import joblib
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)


class MLService:
    """Machine Learning service for price prediction."""
    
    # Training data coefficients (pre-calculated from typical real estate data)
    PRICE_MODEL = {
        "basePrice": 50000,  # Base price in INR
        "coefficients": {
            "areaPerSqFt": 100,  # Price per square foot
            "bedrooms": 15000,  # Additional price per bedroom
            "bathrooms": 10000,  # Additional price per bathroom
            "age": -2000,  # Price reduction per year of age
            "location": {
                "urban": 50000,
                "suburban": 30000,
                "rural": 10000
            },
            "condition": {
                "excellent": 40000,
                "good": 20000,
                "fair": 0,
                "poor": -20000
            },
            "amenities": {
                "garage": 15000,
                "garden": 10000,
                "pool": 25000,
                "basement": 20000,
                "balcony": 8000
            }
        }
    }
    
    def __init__(self, model_path: Optional[str] = None, encoder_path: Optional[str] = None):
        """
        Initialize ML Service.
        
        Args:
            model_path: Path to the trained model pickle file
            encoder_path: Path to the encoder pickle file
        """
        self.model = None
        self.encoders = {}
        self.model_loaded = False
        
        # Default paths relative to backend directory
        if model_path is None:
            model_path = os.path.join(os.path.dirname(__file__), '..', '..', 'models', 'model.pkl')
        if encoder_path is None:
            encoder_path = os.path.join(os.path.dirname(__file__), '..', '..', 'models', 'encoder.pkl')
        
        self.model_path = model_path
        self.encoder_path = encoder_path
        
        # Try to load model on initialization
        self.load_model()
    
    def load_model(self) -> bool:
        """
        Load the ML model and encoders from disk.
        
        Returns:
            bool: True if model loaded successfully, False otherwise
        """
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                logger.info(f"✅ ML model loaded from {self.model_path}")
                self.model_loaded = True
                
                # Load encoders if available
                if os.path.exists(self.encoder_path):
                    encoder = joblib.load(self.encoder_path)
                    # Reconstruct individual column encoders
                    for col in ['Location', 'Condition', 'Garage']:
                        self.encoders[col] = encoder
                    logger.info(f"✅ Encoders loaded from {self.encoder_path}")
                
                return True
            else:
                logger.warning(f"⚠️  Model file not found at {self.model_path}. Using fallback heuristic model.")
                return False
                
        except Exception as e:
            logger.error(f"❌ Failed to load ML model: {e}")
            self.model = None
            self.model_loaded = False
            return False
    
    def preprocess_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Apply preprocessing to features for ML model.
        
        Args:
            df: DataFrame with raw features
            
        Returns:
            DataFrame with preprocessed features
        """
        df_processed = df.copy()
        
        # Normalize column names to match training (capitalize first letter)
        df_processed.columns = [col[0].upper() + col[1:] for col in df_processed.columns]
        
        # Convert garage field to Yes/No format
        if 'Garage' in df_processed:
            df_processed['Garage'] = df_processed['Garage'].map(lambda x: 
                'Yes' if (isinstance(x, bool) and x) or 
                         str(x).lower() in ['yes', 'true', '1'] 
                else 'No')
        
        # Apply label encoding for categorical columns
        label_cols = ['Location', 'Condition', 'Garage']
        for col in label_cols:
            if col in df_processed and self.encoders and col in self.encoders:
                try:
                    df_processed[col] = self.encoders[col].transform(df_processed[col])
                except Exception as e:
                    logger.warning(f"Could not encode {col}, using default value: {e}")
                    df_processed[col] = 0  # Use first category as default
        
        # Fill NaN values with 0 for numeric columns
        for col in df_processed.columns:
            if df_processed[col].dtype != object:
                df_processed[col] = df_processed[col].fillna(0)
        
        return df_processed
    
    def predict_ml(self, features: Dict[str, Any]) -> Optional[float]:
        """
        Predict price using ML model.
        
        Args:
            features: Dictionary of property features
            
        Returns:
            Predicted price or None if model unavailable
        """
        if not self.model_loaded or self.model is None:
            return None
        
        try:
            df = pd.DataFrame([features])
            df_processed = self.preprocess_features(df)
            X = df_processed.values
            prediction = self.model.predict(X)[0]
            return float(prediction)
        except Exception as e:
            logger.error(f"ML prediction failed: {e}")
            return None
    
    def predict_heuristic(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict price using heuristic/rule-based model (fallback).
        
        Args:
            features: Dictionary of property features
            
        Returns:
            Dictionary with prediction details including price, range, and breakdown
        """
        price = self.PRICE_MODEL["basePrice"]
        current_year = datetime.now().year
        
        # Normalize field names (support both lowercase and capitalized)
        area = features.get('area') or features.get('Area', 0)
        bedrooms = features.get('bedrooms') or features.get('Bedrooms', 0)
        bathrooms = features.get('bathrooms') or features.get('Bathrooms', 0)
        floors = features.get('floors') or features.get('Floors', 1)
        
        # Determine age from yearBuilt
        year_built = features.get('yearBuilt') or features.get('YearBuilt')
        age = 0
        if year_built:
            age = current_year - year_built
        elif 'age' in features:
            age = features['age']
        
        location = (features.get('location') or features.get('Location', '')).lower()
        condition = (features.get('condition') or features.get('Condition', '')).lower()
        
        # Calculate contributions
        area_contrib = area * self.PRICE_MODEL["coefficients"]["areaPerSqFt"]
        bedroom_contrib = bedrooms * self.PRICE_MODEL["coefficients"]["bedrooms"]
        bathroom_contrib = bathrooms * self.PRICE_MODEL["coefficients"]["bathrooms"]
        floor_contrib = (floors - 1) * (self.PRICE_MODEL["coefficients"]["bedrooms"] * 0.5)
        age_adjustment = age * self.PRICE_MODEL["coefficients"]["age"]
        
        location_premium = self.PRICE_MODEL["coefficients"]["location"].get(location, 0)
        condition_adjustment = self.PRICE_MODEL["coefficients"]["condition"].get(condition, 0)
        
        # Handle garage
        garage = features.get('garage') or features.get('Garage')
        has_garage = False
        if isinstance(garage, bool):
            has_garage = garage
        elif isinstance(garage, str):
            has_garage = garage.lower() in ['yes', 'true', '1']
        
        # Check amenities array
        amenities = features.get('amenities', [])
        if not has_garage and amenities:
            has_garage = any(str(a).lower() == 'garage' for a in amenities)
        
        garage_contrib = self.PRICE_MODEL["coefficients"]["amenities"]["garage"] if has_garage else 0
        
        # Calculate other amenities
        other_amenities_contrib = 0
        if amenities:
            for amenity in amenities:
                amenity_lower = str(amenity).lower()
                if amenity_lower != 'garage':  # Avoid double counting
                    other_amenities_contrib += self.PRICE_MODEL["coefficients"]["amenities"].get(amenity_lower, 0)
        
        # Total price
        price += (area_contrib + bedroom_contrib + bathroom_contrib + floor_contrib + 
                  age_adjustment + location_premium + condition_adjustment + 
                  garage_contrib + other_amenities_contrib)
        
        # Market variance (±10%)
        market_variance = price * 0.1
        min_price = max(0, price - market_variance)
        max_price = price + market_variance
        
        return {
            "estimatedPrice": round(price),
            "priceRange": {
                "min": round(min_price),
                "max": round(max_price)
            },
            "confidence": 0.85,
            "breakdown": {
                "basePrice": self.PRICE_MODEL["basePrice"],
                "areaContribution": round(area_contrib),
                "bedroomContribution": round(bedroom_contrib),
                "bathroomContribution": round(bathroom_contrib),
                "floorsContribution": round(floor_contrib),
                "ageAdjustment": round(age_adjustment),
                "locationPremium": location_premium,
                "conditionAdjustment": condition_adjustment,
                "garageContribution": garage_contrib,
                "otherAmenitiesContribution": round(other_amenities_contrib)
            }
        }
    
    async def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict property price using ML model or fallback to heuristic.
        
        Args:
            features: Dictionary of property features
            
        Returns:
            Dictionary with prediction results
        """
        model_used = "heuristic"
        
        # Try ML model first
        ml_prediction = self.predict_ml(features)
        
        if ml_prediction is not None:
            model_used = "ml_model"
            prediction_result = {
                "estimatedPrice": round(ml_prediction),
                "priceRange": {
                    "min": round(ml_prediction * 0.95),
                    "max": round(ml_prediction * 1.05)
                },
                "confidence": 0.90,
                "breakdown": {}
            }
        else:
            # Fallback to heuristic model
            prediction_result = self.predict_heuristic(features)
        
        return {
            "success": True,
            "prediction": prediction_result,
            "modelUsed": model_used,
            "currency": "INR",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def batch_predict(self, properties: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Predict prices for multiple properties.
        
        Args:
            properties: List of property feature dictionaries
            
        Returns:
            Dictionary with batch prediction results
        """
        if not properties:
            return {
                "success": False,
                "error": "No properties provided for prediction"
            }
        
        predictions = []
        
        # Try ML model for batch prediction
        if self.model_loaded and self.model is not None:
            try:
                df = pd.DataFrame(properties)
                df_processed = self.preprocess_features(df)
                X = df_processed.values
                ml_predictions = self.model.predict(X)
                
                for idx, (prop, ml_pred) in enumerate(zip(properties, ml_predictions)):
                    predictions.append({
                        "propertyId": idx + 1,
                        "features": prop,
                        "prediction": {
                            "estimatedPrice": round(float(ml_pred)),
                            "priceRange": {
                                "min": round(float(ml_pred) * 0.95),
                                "max": round(float(ml_pred) * 1.05)
                            },
                            "confidence": 0.90,
                            "breakdown": {}
                        }
                    })
                
                return {
                    "success": True,
                    "modelUsed": "ml_model",
                    "predictions": predictions,
                    "currency": "INR",
                    "timestamp": datetime.utcnow().isoformat()
                }
            except Exception as e:
                logger.error(f"Batch ML prediction failed: {e}")
                # Fall through to heuristic
        
        # Fallback to heuristic for each property
        for idx, prop in enumerate(properties):
            heuristic_result = self.predict_heuristic(prop)
            predictions.append({
                "propertyId": idx + 1,
                "features": prop,
                "prediction": heuristic_result
            })
        
        return {
            "success": True,
            "modelUsed": "heuristic",
            "predictions": predictions,
            "currency": "INR",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def get_market_trends(self) -> Dict[str, Any]:
        """
        Get current market trends (placeholder for future implementation).
        
        Returns:
            Dictionary with market trend information
        """
        return {
            "success": True,
            "trends": {
                "averagePricePerSqFt": self.PRICE_MODEL["coefficients"]["areaPerSqFt"],
                "locationPremiums": self.PRICE_MODEL["coefficients"]["location"],
                "conditionAdjustments": self.PRICE_MODEL["coefficients"]["condition"],
                "amenityValues": self.PRICE_MODEL["coefficients"]["amenities"]
            },
            "lastUpdated": datetime.utcnow().isoformat(),
            "message": "Market trends based on current pricing model"
        }


# Global ML service instance
ml_service = MLService()
