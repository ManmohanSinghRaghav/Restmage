"""
Unit tests for ML Service.
"""
import pytest
from app.services.ml_service import MLService


class TestMLService:
    """Test ML Service functionality."""
    
    @pytest.fixture
    def ml_service(self):
        """Create ML service instance for testing."""
        return MLService()
    
    def test_ml_service_initialization(self, ml_service):
        """Test ML service initializes correctly."""
        assert ml_service is not None
        assert hasattr(ml_service, 'model')
        assert hasattr(ml_service, 'encoders')
        assert hasattr(ml_service, 'PRICE_MODEL')
    
    def test_heuristic_prediction_basic(self, ml_service):
        """Test basic heuristic prediction."""
        features = {
            "area": 2000,
            "bedrooms": 3,
            "bathrooms": 2,
            "floors": 2,
            "yearBuilt": 2010,
            "location": "Urban",
            "condition": "Good",
            "garage": True
        }
        
        result = ml_service.predict_heuristic(features)
        
        assert result is not None
        assert "estimatedPrice" in result
        assert "priceRange" in result
        assert "confidence" in result
        assert "breakdown" in result
        
        # Price should be positive
        assert result["estimatedPrice"] > 0
        assert result["priceRange"]["min"] > 0
        assert result["priceRange"]["max"] > result["priceRange"]["min"]
        
        # Confidence should be between 0 and 1
        assert 0 <= result["confidence"] <= 1
    
    def test_heuristic_prediction_minimal_features(self, ml_service):
        """Test prediction with minimal features."""
        features = {
            "area": 1000,
            "bedrooms": 2,
            "bathrooms": 1,
            "floors": 1,
            "yearBuilt": 2020
        }
        
        result = ml_service.predict_heuristic(features)
        
        assert result is not None
        assert result["estimatedPrice"] > 0
    
    def test_heuristic_prediction_with_amenities(self, ml_service):
        """Test prediction with multiple amenities."""
        features = {
            "area": 3000,
            "bedrooms": 4,
            "bathrooms": 3,
            "floors": 2,
            "yearBuilt": 2015,
            "location": "Urban",
            "condition": "Excellent",
            "amenities": ["garage", "pool", "garden", "basement"]
        }
        
        result = ml_service.predict_heuristic(features)
        
        # Price should be higher with more amenities
        assert result["estimatedPrice"] > 300000
        assert result["breakdown"]["otherAmenitiesContribution"] > 0
    
    def test_heuristic_prediction_age_from_year(self, ml_service):
        """Test that age is calculated correctly from yearBuilt."""
        from datetime import datetime
        current_year = datetime.now().year
        
        features = {
            "area": 1500,
            "bedrooms": 3,
            "bathrooms": 2,
            "floors": 1,
            "yearBuilt": 2000,
            "location": "Suburban",
            "condition": "Fair"
        }
        
        result = ml_service.predict_heuristic(features)
        
        expected_age = current_year - 2000
        expected_age_adjustment = expected_age * ml_service.PRICE_MODEL["coefficients"]["age"]
        
        assert result["breakdown"]["ageAdjustment"] == expected_age_adjustment
    
    def test_heuristic_prediction_location_premium(self, ml_service):
        """Test location premium calculation."""
        base_features = {
            "area": 2000,
            "bedrooms": 3,
            "bathrooms": 2,
            "floors": 1,
            "yearBuilt": 2015,
            "condition": "Good"
        }
        
        # Urban location
        urban_features = {**base_features, "location": "Urban"}
        urban_result = ml_service.predict_heuristic(urban_features)
        
        # Rural location
        rural_features = {**base_features, "location": "Rural"}
        rural_result = ml_service.predict_heuristic(rural_features)
        
        # Urban should be more expensive than rural
        assert urban_result["estimatedPrice"] > rural_result["estimatedPrice"]
    
    def test_heuristic_prediction_condition_adjustment(self, ml_service):
        """Test condition adjustment calculation."""
        base_features = {
            "area": 2000,
            "bedrooms": 3,
            "bathrooms": 2,
            "floors": 1,
            "yearBuilt": 2015,
            "location": "Urban"
        }
        
        # Excellent condition
        excellent_features = {**base_features, "condition": "Excellent"}
        excellent_result = ml_service.predict_heuristic(excellent_features)
        
        # Poor condition
        poor_features = {**base_features, "condition": "Poor"}
        poor_result = ml_service.predict_heuristic(poor_features)
        
        # Excellent should be more expensive than poor
        assert excellent_result["estimatedPrice"] > poor_result["estimatedPrice"]
    
    def test_heuristic_prediction_garage_boolean(self, ml_service):
        """Test garage as boolean."""
        features = {
            "area": 1500,
            "bedrooms": 3,
            "bathrooms": 2,
            "floors": 1,
            "yearBuilt": 2015,
            "garage": True
        }
        
        result = ml_service.predict_heuristic(features)
        
        expected_garage_contrib = ml_service.PRICE_MODEL["coefficients"]["amenities"]["garage"]
        assert result["breakdown"]["garageContribution"] == expected_garage_contrib
    
    def test_heuristic_prediction_garage_string(self, ml_service):
        """Test garage as string."""
        features = {
            "area": 1500,
            "bedrooms": 3,
            "bathrooms": 2,
            "floors": 1,
            "yearBuilt": 2015,
            "garage": "Yes"
        }
        
        result = ml_service.predict_heuristic(features)
        
        expected_garage_contrib = ml_service.PRICE_MODEL["coefficients"]["amenities"]["garage"]
        assert result["breakdown"]["garageContribution"] == expected_garage_contrib
    
    def test_heuristic_prediction_garage_in_amenities(self, ml_service):
        """Test garage in amenities array."""
        features = {
            "area": 1500,
            "bedrooms": 3,
            "bathrooms": 2,
            "floors": 1,
            "yearBuilt": 2015,
            "amenities": ["garage", "garden"]
        }
        
        result = ml_service.predict_heuristic(features)
        
        expected_garage_contrib = ml_service.PRICE_MODEL["coefficients"]["amenities"]["garage"]
        assert result["breakdown"]["garageContribution"] == expected_garage_contrib
    
    @pytest.mark.asyncio
    async def test_predict_method(self, ml_service):
        """Test async predict method."""
        features = {
            "area": 2000,
            "bedrooms": 3,
            "bathrooms": 2,
            "floors": 2,
            "yearBuilt": 2010,
            "location": "Urban",
            "condition": "Good"
        }
        
        result = await ml_service.predict(features)
        
        assert result is not None
        assert result["success"] is True
        assert "prediction" in result
        assert "modelUsed" in result
        assert "currency" in result
        assert result["currency"] == "INR"
    
    @pytest.mark.asyncio
    async def test_batch_predict_empty(self, ml_service):
        """Test batch predict with empty list."""
        result = await ml_service.batch_predict([])
        
        assert result is not None
        assert result["success"] is False
        assert "error" in result
    
    @pytest.mark.asyncio
    async def test_batch_predict_single(self, ml_service):
        """Test batch predict with single property."""
        properties = [
            {
                "area": 2000,
                "bedrooms": 3,
                "bathrooms": 2,
                "floors": 2,
                "yearBuilt": 2010
            }
        ]
        
        result = await ml_service.batch_predict(properties)
        
        assert result is not None
        assert result["success"] is True
        assert "predictions" in result
        assert len(result["predictions"]) == 1
        assert result["predictions"][0]["propertyId"] == 1
    
    @pytest.mark.asyncio
    async def test_batch_predict_multiple(self, ml_service):
        """Test batch predict with multiple properties."""
        properties = [
            {
                "area": 2000,
                "bedrooms": 3,
                "bathrooms": 2,
                "floors": 2,
                "yearBuilt": 2010,
                "location": "Urban"
            },
            {
                "area": 1500,
                "bedrooms": 2,
                "bathrooms": 1,
                "floors": 1,
                "yearBuilt": 2015,
                "location": "Suburban"
            },
            {
                "area": 2500,
                "bedrooms": 4,
                "bathrooms": 3,
                "floors": 2,
                "yearBuilt": 2018,
                "location": "Urban",
                "condition": "Excellent"
            }
        ]
        
        result = await ml_service.batch_predict(properties)
        
        assert result is not None
        assert result["success"] is True
        assert len(result["predictions"]) == 3
        
        # Check property IDs
        for idx, pred in enumerate(result["predictions"]):
            assert pred["propertyId"] == idx + 1
    
    @pytest.mark.asyncio
    async def test_get_market_trends(self, ml_service):
        """Test market trends retrieval."""
        result = await ml_service.get_market_trends()
        
        assert result is not None
        assert result["success"] is True
        assert "trends" in result
        assert "lastUpdated" in result
        
        trends = result["trends"]
        assert "averagePricePerSqFt" in trends
        assert "locationPremiums" in trends
        assert "conditionAdjustments" in trends
        assert "amenityValues" in trends
