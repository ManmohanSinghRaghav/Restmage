"""
Configuration Settings
Loads environment variables and provides application settings
"""

from pydantic_settings import BaseSettings
from typing import List
import os
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 5000
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Database Configuration
    MONGODB_URI: str = "mongodb://localhost:27017/restmage"
    MONGODB_DATABASE: str = "restmage"
    MONGODB_MIN_POOL_SIZE: int = 10
    MONGODB_MAX_POOL_SIZE: int = 100
    
    # JWT Configuration
    JWT_SECRET: str = "your_super_secret_jwt_key_min_32_characters_long"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_DAYS: int = 7
    
    # CORS Configuration
    CLIENT_URL: str = "http://localhost:3000"
    CORS_ORIGINS: str = ""  # Comma-separated origins from Vercel
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    ALLOWED_HOSTS: List[str] = ["*"]
    ALLOW_ALL_ORIGINS: bool = False
    
    # Rate Limiting
    RATE_LIMIT_WINDOW_MS: int = 900000  # 15 minutes
    RATE_LIMIT_MAX_REQUESTS: int = 100
    
    # File Upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES: List[str] = ["image/jpeg", "image/png", "image/gif", "application/pdf"]
    
    # Google Gemini AI (Optional)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-pro"
    
    # Python ML Model (Optional)
    PYTHON_EXECUTABLE: str = "python"
    ML_MODEL_PATH: str = "./model.pkl"
    ENCODER_PATH: str = "./encoder.pkl"
    
    # Password Hashing
    BCRYPT_ROUNDS: int = 12
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Parse CORS_ORIGINS from Vercel environment variable
        if self.CORS_ORIGINS:
            cors_list = [
                origin.strip() 
                for origin in self.CORS_ORIGINS.split(",") 
                if origin.strip()
            ]
            if cors_list:
                self.ALLOWED_ORIGINS = cors_list
        
        # Parse ALLOWED_ORIGINS if it's a comma-separated string
        elif isinstance(self.ALLOWED_ORIGINS, str):
            self.ALLOWED_ORIGINS = [
                origin.strip() 
                for origin in self.ALLOWED_ORIGINS.split(",") 
                if origin.strip()
            ]
        
        # Allow all origins in development if flag is set
        if self.ALLOW_ALL_ORIGINS or self.ENVIRONMENT == "development":
            self.ALLOWED_ORIGINS = ["*"]


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance
    Uses lru_cache to ensure settings are only loaded once
    """
    return Settings()


# Global settings instance
settings = get_settings()
