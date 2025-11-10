"""Test configuration and fixtures."""
import pytest
import asyncio
from typing import Generator, AsyncGenerator
from motor.motor_asyncio import AsyncIOMotorClient
from httpx import AsyncClient
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings
from app.core.database import get_database


# Test database
TEST_DATABASE_URL = "mongodb://localhost:27017/restmage_test"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def test_db():
    """Create test database connection."""
    client = AsyncIOMotorClient(TEST_DATABASE_URL)
    db = client.get_default_database()
    yield db
    # Cleanup: drop test database after each test
    await client.drop_database(db.name)
    client.close()


@pytest.fixture(scope="function")
async def async_client() -> AsyncGenerator:
    """Create async HTTP client for testing."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture(scope="function")
def client() -> Generator:
    """Create synchronous test client."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def sample_user():
    """Sample user data for testing."""
    return {
        "name": "Test User",
        "email": "test@example.com",
        "password": "Test123456!"
    }


@pytest.fixture
def sample_property():
    """Sample property features for testing."""
    return {
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


@pytest.fixture
def sample_project():
    """Sample project data for testing."""
    return {
        "name": "Test Project",
        "description": "Test project description",
        "location": "Test Location",
        "propertyType": "Residential",
        "status": "active"
    }


@pytest.fixture
async def auth_headers(async_client: AsyncClient, sample_user):
    """Get authentication headers for testing."""
    # Register user
    await async_client.post("/api/auth/register", json=sample_user)
    
    # Login
    login_response = await async_client.post(
        "/api/auth/login",
        json={
            "email": sample_user["email"],
            "password": sample_user["password"]
        }
    )
    
    token = login_response.json()["token"]
    return {"Authorization": f"Bearer {token}"}
