"""
Database Connection and Configuration
Async MongoDB connection using Motor
"""

from motor.motor_asyncio import AsyncIOMotorClient
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure
from typing import Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class Database:
    """Database connection manager"""
    
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None


# Global database instance
database = Database()


async def connect_to_mongo():
    """
    Establish connection to MongoDB
    Called on application startup
    """
    try:
        logger.info("Connecting to MongoDB...")
        
        database.client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            minPoolSize=settings.MONGODB_MIN_POOL_SIZE,
            maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
            serverSelectionTimeoutMS=5000
        )
        
        # Get database instance
        database.db = database.client[settings.MONGODB_DATABASE]
        
        # Test connection
        await database.client.admin.command('ping')
        
        logger.info(f"✅ Connected to MongoDB: {settings.MONGODB_DATABASE}")
        
        # Create indexes
        await create_indexes()
        
    except ConnectionFailure as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error connecting to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """
    Close MongoDB connection
    Called on application shutdown
    """
    if database.client:
        logger.info("Closing MongoDB connection...")
        database.client.close()
        logger.info("✅ MongoDB connection closed")


async def create_indexes():
    """Create database indexes for optimal performance"""
    try:
        # Users collection indexes
        await database.db.users.create_index("email", unique=True)
        await database.db.users.create_index("username", unique=True)
        await database.db.users.create_index("createdAt")
        
        logger.info("✅ Database indexes created successfully")
        
    except Exception as e:
        logger.warning(f"⚠️ Failed to create some indexes: {e}")


def get_database() -> AsyncIOMotorDatabase:
    """
    Get database instance
    Used as a FastAPI dependency
    """
    if database.db is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongo() first.")
    return database.db


# Dependency for FastAPI routes
async def get_db() -> AsyncIOMotorDatabase:
    """FastAPI dependency to get database instance"""
    return get_database()
