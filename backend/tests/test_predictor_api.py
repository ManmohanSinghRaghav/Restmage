"""
Integration tests for Predictor API endpoints.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestPredictorAPI:
    """Test Predictor API endpoints."""
    
    async def test_predictor_health_endpoint(self, async_client: AsyncClient):
        """Test predictor health check endpoint."""
        response = await async_client.get("/api/predictor/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data
        assert "mlModelLoaded" in data
        assert data["status"] in ["healthy", "degraded", "error"]
    
    async def test_predict_without_auth(self, async_client: AsyncClient):
        """Test prediction endpoint without authentication."""
        payload = {
            "features": {
                "area": 2000,
                "bedrooms": 3,
                "bathrooms": 2,
                "floors": 2,
                "yearBuilt": 2010
            }
        }
        
        response = await async_client.post("/api/predictor/predict", json=payload)
        
        # Should return 401 Unauthorized
        assert response.status_code == 401
    
    async def test_predict_with_auth_valid(self, async_client: AsyncClient, auth_headers, sample_property):
        """Test prediction endpoint with valid authentication and data."""
        payload = {"features": sample_property}
        
        response = await async_client.post(
            "/api/predictor/predict",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure
        assert data["success"] is True
        assert "prediction" in data
        assert "inputFeatures" in data
        assert "modelUsed" in data
        assert "currency" in data
        assert "timestamp" in data
        assert "disclaimer" in data
        
        # Validate prediction structure
        prediction = data["prediction"]
        assert "estimatedPrice" in prediction
        assert "priceRange" in prediction
        assert "confidence" in prediction
        assert "breakdown" in prediction
        
        # Validate price range
        price_range = prediction["priceRange"]
        assert "min" in price_range
        assert "max" in price_range
        assert price_range["min"] < prediction["estimatedPrice"]
        assert price_range["max"] > prediction["estimatedPrice"]
        
        # Validate confidence
        assert 0 <= prediction["confidence"] <= 1
        
        # Validate currency
        assert data["currency"] == "INR"
    
    async def test_predict_minimal_features(self, async_client: AsyncClient, auth_headers):
        """Test prediction with minimal required features."""
        payload = {
            "features": {
                "area": 1500,
                "bedrooms": 2,
                "bathrooms": 1,
                "floors": 1,
                "yearBuilt": 2020
            }
        }
        
        response = await async_client.post(
            "/api/predictor/predict",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["prediction"]["estimatedPrice"] > 0
    
    async def test_predict_missing_required_fields(self, async_client: AsyncClient, auth_headers):
        """Test prediction with missing required fields."""
        payload = {
            "features": {
                "area": 2000,
                "bedrooms": 3
                # Missing bathrooms, floors, yearBuilt
            }
        }
        
        response = await async_client.post(
            "/api/predictor/predict",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
    
    async def test_predict_with_age_instead_of_year(self, async_client: AsyncClient, auth_headers):
        """Test prediction with age instead of yearBuilt."""
        payload = {
            "features": {
                "area": 1800,
                "bedrooms": 3,
                "bathrooms": 2,
                "floors": 1,
                "age": 10  # Use age instead of yearBuilt
            }
        }
        
        response = await async_client.post(
            "/api/predictor/predict",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    async def test_predict_all_optional_features(self, async_client: AsyncClient, auth_headers):
        """Test prediction with all optional features."""
        payload = {
            "features": {
                "area": 3000,
                "bedrooms": 4,
                "bathrooms": 3,
                "floors": 2,
                "yearBuilt": 2015,
                "location": "Urban",
                "condition": "Excellent",
                "garage": True,
                "amenities": ["garage", "pool", "garden", "basement", "balcony"]
            }
        }
        
        response = await async_client.post(
            "/api/predictor/predict",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        
        # Price should be higher with all amenities
        assert data["prediction"]["estimatedPrice"] > 500000
    
    async def test_batch_predict_without_auth(self, async_client: AsyncClient):
        """Test batch prediction without authentication."""
        payload = {
            "properties": [
                {
                    "area": 2000,
                    "bedrooms": 3,
                    "bathrooms": 2,
                    "floors": 2,
                    "yearBuilt": 2010
                }
            ]
        }
        
        response = await async_client.post("/api/predictor/batch-predict", json=payload)
        
        assert response.status_code == 401
    
    async def test_batch_predict_empty_list(self, async_client: AsyncClient, auth_headers):
        """Test batch prediction with empty property list."""
        payload = {"properties": []}
        
        response = await async_client.post(
            "/api/predictor/batch-predict",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 400
    
    async def test_batch_predict_single_property(self, async_client: AsyncClient, auth_headers):
        """Test batch prediction with single property."""
        payload = {
            "properties": [
                {
                    "area": 2000,
                    "bedrooms": 3,
                    "bathrooms": 2,
                    "floors": 2,
                    "yearBuilt": 2010,
                    "location": "Urban",
                    "condition": "Good"
                }
            ]
        }
        
        response = await async_client.post(
            "/api/predictor/batch-predict",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "predictions" in data
        assert len(data["predictions"]) == 1
        
        prediction = data["predictions"][0]
        assert prediction["propertyId"] == 1
        assert "features" in prediction
        assert "prediction" in prediction
    
    async def test_batch_predict_multiple_properties(self, async_client: AsyncClient, auth_headers):
        """Test batch prediction with multiple properties."""
        payload = {
            "properties": [
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
        }
        
        response = await async_client.post(
            "/api/predictor/batch-predict",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert len(data["predictions"]) == 3
        
        # Verify property IDs are sequential
        for idx, pred in enumerate(data["predictions"]):
            assert pred["propertyId"] == idx + 1
            assert "prediction" in pred
            assert pred["prediction"]["estimatedPrice"] > 0
    
    async def test_batch_predict_too_many_properties(self, async_client: AsyncClient, auth_headers):
        """Test batch prediction with more than 100 properties."""
        # Create 101 properties
        properties = []
        for i in range(101):
            properties.append({
                "area": 2000,
                "bedrooms": 3,
                "bathrooms": 2,
                "floors": 2,
                "yearBuilt": 2010
            })
        
        payload = {"properties": properties}
        
        response = await async_client.post(
            "/api/predictor/batch-predict",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 400
    
    async def test_market_trends_without_auth(self, async_client: AsyncClient):
        """Test market trends endpoint without authentication."""
        response = await async_client.get("/api/predictor/market-trends")
        
        assert response.status_code == 401
    
    async def test_market_trends_with_auth(self, async_client: AsyncClient, auth_headers):
        """Test market trends endpoint with authentication."""
        response = await async_client.get(
            "/api/predictor/market-trends",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "trends" in data
        assert "lastUpdated" in data
        
        trends = data["trends"]
        assert "averagePricePerSqFt" in trends
        assert "locationPremiums" in trends
        assert "conditionAdjustments" in trends
        assert "amenityValues" in trends
        
        # Validate structure
        assert isinstance(trends["locationPremiums"], dict)
        assert isinstance(trends["conditionAdjustments"], dict)
        assert isinstance(trends["amenityValues"], dict)
    
    async def test_predict_location_variations(self, async_client: AsyncClient, auth_headers):
        """Test prediction with different location types."""
        locations = ["Urban", "Suburban", "Rural"]
        results = []
        
        for location in locations:
            payload = {
                "features": {
                    "area": 2000,
                    "bedrooms": 3,
                    "bathrooms": 2,
                    "floors": 2,
                    "yearBuilt": 2010,
                    "location": location,
                    "condition": "Good"
                }
            }
            
            response = await async_client.post(
                "/api/predictor/predict",
                json=payload,
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            results.append(data["prediction"]["estimatedPrice"])
        
        # Urban should be most expensive, Rural least expensive
        assert results[0] > results[1] > results[2]
    
    async def test_predict_condition_variations(self, async_client: AsyncClient, auth_headers):
        """Test prediction with different condition types."""
        conditions = ["Excellent", "Good", "Fair", "Poor"]
        results = []
        
        for condition in conditions:
            payload = {
                "features": {
                    "area": 2000,
                    "bedrooms": 3,
                    "bathrooms": 2,
                    "floors": 2,
                    "yearBuilt": 2010,
                    "location": "Urban",
                    "condition": condition
                }
            }
            
            response = await async_client.post(
                "/api/predictor/predict",
                json=payload,
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            results.append(data["prediction"]["estimatedPrice"])
        
        # Prices should decrease: Excellent > Good > Fair > Poor
        assert results[0] > results[1] > results[2] > results[3]
