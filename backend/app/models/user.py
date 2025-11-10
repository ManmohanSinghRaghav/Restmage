"""
Pydantic Models - User
Data validation and serialization for User entity
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from pydantic_core import core_schema
from typing import List, Optional, Any
from datetime import datetime
from bson import ObjectId


class PyObjectId(str):
    """Custom ObjectId type for Pydantic v2 - stores as string"""
    
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler
    ) -> core_schema.CoreSchema:
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.str_schema(),
        ],
        serialization=core_schema.plain_serializer_function_ser_schema(
            lambda x: str(x) if x else None
        ))
    
    @classmethod
    def _validate(cls, v: Any) -> str:
        """Validate and convert to string"""
        if v is None:
            return None
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str):
            return v
        return str(v)


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
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    password_hash: str
    role: str = "user"
    projects: List[str] = []  # Store as strings for easier serialization
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
