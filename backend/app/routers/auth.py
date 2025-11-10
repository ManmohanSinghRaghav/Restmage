"""
Authentication Router
Handles user registration, login, and profile management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from bson import ObjectId

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, get_token_expiry_seconds
from app.core.deps import get_current_user, get_current_active_user
from app.models.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    UserInDB,
    UserUpdate
)

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Register a new user
    
    - **username**: Alphanumeric username (3-30 characters)
    - **email**: Valid email address
    - **password**: Password (minimum 6 characters)
    
    Returns JWT token and user data
    """
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    existing_username = await db.users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Hash password
    password_hash = hash_password(user_data.password)
    
    # Create user document
    user_doc = {
        "username": user_data.username,
        "email": user_data.email.lower(),
        "password_hash": password_hash,
        "role": "user",
        "projects": [],
        "created_at": datetime.utcnow(),
        "last_login": datetime.utcnow(),
        "is_active": True
    }
    
    # Insert into database
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Create access token
    access_token = create_access_token(
        data={"user_id": user_id, "email": user_data.email.lower()}
    )
    
    # Build response directly
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=get_token_expiry_seconds(),
        user=UserResponse(
            _id=user_id,
            username=user_data.username,
            email=user_data.email,
            role="user",
            created_at=user_doc["created_at"],
            last_login=user_doc["last_login"]
        )
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Login with email and password
    
    - **email**: User's email address
    - **password**: User's password
    
    Returns JWT token and user data
    """
    # Find user by email
    user_doc = await db.users.find_one({"email": credentials.email.lower()})
    
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user_doc["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if not user_doc.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact support."
        )
    
    # Update last login
    await db.users.update_one(
        {"_id": user_doc["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    user_id = str(user_doc["_id"])
    
    # Create access token
    access_token = create_access_token(
        data={"user_id": user_id, "email": user_doc["email"]}
    )
    
    # Convert ObjectIds to strings for Pydantic
    user_doc["_id"] = user_id
    if "projects" in user_doc and user_doc["projects"]:
        user_doc["projects"] = [str(p) if isinstance(p, ObjectId) else p for p in user_doc["projects"]]
    
    # Build response without UserInDB model
    user_response = UserResponse(
        _id=user_id,
        username=user_doc["username"],
        email=user_doc["email"],
        role=user_doc.get("role", "user"),
        created_at=user_doc["created_at"],
        last_login=datetime.utcnow()
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=get_token_expiry_seconds(),
        user=user_response
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Get current user's profile
    
    Requires authentication
    """
    return UserResponse(
        _id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        created_at=current_user.created_at,
        last_login=current_user.last_login
    )


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update current user's profile
    
    - **username**: New username (optional)
    - **email**: New email (optional)
    - **password**: New password (optional)
    
    Requires authentication
    """
    update_data = {}
    
    # Update username
    if user_update.username:
        # Check if username is taken
        existing = await db.users.find_one({
            "username": user_update.username,
            "_id": {"$ne": current_user.id}
        })
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        update_data["username"] = user_update.username
    
    # Update email
    if user_update.email:
        # Check if email is taken
        existing = await db.users.find_one({
            "email": user_update.email.lower(),
            "_id": {"$ne": current_user.id}
        })
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        update_data["email"] = user_update.email.lower()
    
    # Update password
    if user_update.password:
        update_data["password_hash"] = hash_password(user_update.password)
    
    # Update database
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.users.update_one(
            {"_id": current_user.id},
            {"$set": update_data}
        )
    
    # Get updated user
    user_doc = await db.users.find_one({"_id": current_user.id})
    user = UserInDB(**user_doc)
    
    return UserResponse(
        _id=str(user.id),
        username=user.username,
        email=user.email,
        role=user.role,
        created_at=user.created_at,
        last_login=user.last_login
    )


@router.post("/logout")
async def logout(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Logout current user
    
    Note: Since we use JWT, logout is handled client-side by removing the token
    This endpoint can be used for logging purposes
    """
    return {
        "message": "Successfully logged out",
        "detail": "Please remove the token from client storage"
    }


@router.get("/verify-token")
async def verify_token(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Verify if token is valid
    
    Returns user data if token is valid
    """
    return {
        "valid": True,
        "user": UserResponse(
            _id=str(current_user.id),
            username=current_user.username,
            email=current_user.email,
            role=current_user.role,
            created_at=current_user.created_at,
            last_login=current_user.last_login
        )
    }
