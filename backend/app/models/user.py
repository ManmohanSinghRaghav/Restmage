"""
Pydantic Models - User
Data validation and serialization for User entity
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
from bson import ObjectId


class UserBase(BaseModel):
    """Base user model with common fields"""
    username: str = Field(..., min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    
    @field_validator('username')
    @classmethod
    def username_alphanumeric(cls, v):
        assert v.replace('_', '').isalnum(), 'Username must be alphanumeric'
        return v


class UserCreate(UserBase):
    """Model for user registration"""
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    """Model for user login"""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Model for user updates"""
    username: Optional[str] = Field(None, min_length=3, max_length=30)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6)


class UserInDB(UserBase):
    """User model as stored in database"""
    id: Optional[str] = Field(default=None, alias="_id")
    password: str  # Plain password (for development only)
    role: str = "user"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    is_active: bool = True
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
        "json_schema_extra": {
            "example": {
                "username": "johndoe",
                "email": "john@example.com",
                "role": "user",
                "is_active": True
            }
        }
    }


class UserResponse(UserBase):
    """User response model (public data)"""
    id: str = Field(..., alias="_id")
    role: str
    created_at: datetime
    last_login: Optional[datetime] = None
    
    model_config = {
        "populate_by_name": True,
        "json_encoders": {ObjectId: str}
    }


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: UserResponse


class TokenData(BaseModel):
    """Token payload data"""
    user_id: str
    email: str
    exp: Optional[datetime] = None
