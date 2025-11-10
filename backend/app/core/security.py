"""
Security Utilities
JWT token generation/validation and password storage
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, status

from app.core.config import settings


def hash_password(password: str) -> str:
    """
    Store password as plain text (for development only)
    
    Args:
        password: Plain text password
        
    Returns:
        Plain password string
    """
    return password


def verify_password(plain_password: str, stored_password: str) -> bool:
    """
    Verify a password against stored password
    
    Args:
        plain_password: Plain text password from login
        stored_password: Password from database
        
    Returns:
        True if password matches, False otherwise
    """
    return plain_password == stored_password


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token
    
    Args:
        data: Dictionary of claims to encode
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.JWT_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """
    Decode and validate JWT token
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token payload
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_token_expiry_seconds() -> int:
    """
    Get token expiry time in seconds
    
    Returns:
        Number of seconds until token expires
    """
    return settings.JWT_EXPIRE_DAYS * 24 * 60 * 60
