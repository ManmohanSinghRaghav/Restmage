"""
Authentication Dependencies
JWT token validation and user authentication for FastAPI routes
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import Optional

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import UserInDB

# HTTP Bearer token security scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> UserInDB:
    """
    Get current authenticated user from JWT token
    
    Args:
        credentials: HTTP Bearer token from request
        db: Database connection
        
    Returns:
        UserInDB: Current authenticated user
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode JWT token
        token = credentials.credentials
        payload = decode_access_token(token)
        
        user_id: str = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
            
    except Exception:
        raise credentials_exception
    
    # Get user from database
    user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    
    if user_doc is None:
        raise credentials_exception
    
    # Check if user is active
    if not user_doc.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Convert ObjectIds to strings for Pydantic
    user_doc["_id"] = str(user_doc["_id"])
    # Convert to UserInDB model
    user = UserInDB(**user_doc)
    
    return user


async def get_current_active_user(
    current_user: UserInDB = Depends(get_current_user)
) -> UserInDB:
    """
    Get current active user
    
    Args:
        current_user: User from get_current_user dependency
        
    Returns:
        UserInDB: Active user
        
    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def get_current_admin_user(
    current_user: UserInDB = Depends(get_current_user)
) -> UserInDB:
    """
    Get current user and verify admin role
    
    Args:
        current_user: User from get_current_user dependency
        
    Returns:
        UserInDB: Admin user
        
    Raises:
        HTTPException: If user is not an admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    return current_user


class OptionalAuth:
    """Optional authentication - returns user if authenticated, None otherwise"""
    
    async def __call__(
        self,
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(
            HTTPBearer(auto_error=False)
        ),
        db: AsyncIOMotorDatabase = Depends(get_db)
    ) -> Optional[UserInDB]:
        """
        Get user if authenticated, otherwise return None
        
        Args:
            credentials: Optional HTTP Bearer token
            db: Database connection
            
        Returns:
            UserInDB or None
        """
        if credentials is None:
            return None
        
        try:
            # Decode token
            token = credentials.credentials
            payload = decode_access_token(token)
            user_id = payload.get("user_id")
            
            if user_id is None:
                return None
            
            # Get user from database
            user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
            
            if user_doc is None:
                return None
            
            return UserInDB(**user_doc)
            
        except Exception:
            return None


# Instance for optional authentication
optional_auth = OptionalAuth()
