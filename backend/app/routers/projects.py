"""
Projects Router
Handles project CRUD operations and collaboration
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
import math

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_active_user
from app.models.user import UserInDB
from app.models.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
    ProjectInDB,
    ProjectStatus
)

router = APIRouter()


async def get_project_by_id(
    project_id: str,
    user: UserInDB,
    db: AsyncIOMotorDatabase
) -> dict:
    """
    Get project by ID and verify user has access
    
    Args:
        project_id: Project ObjectId string
        user: Current authenticated user
        db: Database connection
        
    Returns:
        Project document
        
    Raises:
        HTTPException: If project not found or user has no access
    """
    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID format"
        )
    
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check if user has access (owner or collaborator)
    has_access = (
        project["owner"] == user.id or
        any(c["user"] == user.id for c in project.get("collaborators", []))
    )
    
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this project"
        )
    
    return project


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Create a new project
    
    Requires authentication
    """
    # Create project document
    project_doc = {
        "name": project_data.name,
        "description": project_data.description,
        "owner": current_user.id,
        "requirements": project_data.requirements.model_dump(),
        "status": project_data.status.value,
        "collaborators": [],
        "floor_plan_data": None,
        "map_data": None,
        "pricing": None,
        "tags": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_modified_by": current_user.id
    }
    
    # Insert into database
    result = await db.projects.insert_one(project_doc)
    project_id = result.inserted_id
    
    # Add project to user's projects list
    await db.users.update_one(
        {"_id": current_user.id},
        {"$addToSet": {"projects": project_id}}
    )
    
    # Get created project with populated owner
    project = await db.projects.find_one({"_id": project_id})
    owner = await db.users.find_one({"_id": project["owner"]})
    
    # Build response
    return ProjectResponse(
        _id=str(project_id),
        name=project["name"],
        description=project["description"],
        owner={
            "_id": str(owner["_id"]),
            "username": owner["username"],
            "email": owner["email"]
        },
        requirements=project_data.requirements,
        status=ProjectStatus(project["status"]),
        floor_plan_data=project.get("floor_plan_data"),
        map_data=project.get("map_data"),
        pricing=project.get("pricing"),
        collaborators=[],
        tags=project.get("tags", []),
        created_at=project["created_at"],
        updated_at=project["updated_at"]
    )


@router.get("/", response_model=ProjectListResponse)
async def get_projects(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    status_filter: Optional[ProjectStatus] = None,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get all projects for authenticated user (owned or collaborated)
    
    - **page**: Page number (default: 1)
    - **limit**: Items per page (default: 10, max: 100)
    - **search**: Search in project name and description
    - **status**: Filter by project status
    
    Requires authentication
    """
    # Build query
    query = {
        "$or": [
            {"owner": current_user.id},
            {"collaborators.user": current_user.id}
        ]
    }
    
    # Add search filter
    if search:
        query["$text"] = {"$search": search}
    
    # Add status filter
    if status_filter:
        query["status"] = status_filter.value
    
    # Get total count
    total = await db.projects.count_documents(query)
    
    # Calculate pagination
    skip = (page - 1) * limit
    total_pages = math.ceil(total / limit)
    
    # Get projects
    cursor = db.projects.find(query).sort("updated_at", -1).skip(skip).limit(limit)
    projects = await cursor.to_list(length=limit)
    
    # Populate owner and collaborators
    project_responses = []
    for project in projects:
        # Get owner
        owner = await db.users.find_one({"_id": project["owner"]})
        
        # Get collaborators
        collaborators = []
        for collab in project.get("collaborators", []):
            user = await db.users.find_one({"_id": collab["user"]})
            if user:
                collaborators.append({
                    "_id": str(user["_id"]),
                    "username": user["username"],
                    "email": user["email"],
                    "role": collab["role"],
                    "added_at": collab["added_at"]
                })
        
        project_responses.append(ProjectResponse(
            _id=str(project["_id"]),
            name=project["name"],
            description=project.get("description"),
            owner={
                "_id": str(owner["_id"]),
                "username": owner["username"],
                "email": owner["email"]
            },
            requirements=project["requirements"],
            status=ProjectStatus(project["status"]),
            floor_plan_data=project.get("floor_plan_data"),
            map_data=project.get("map_data"),
            pricing=project.get("pricing"),
            collaborators=collaborators,
            tags=project.get("tags", []),
            created_at=project["created_at"],
            updated_at=project["updated_at"]
        ))
    
    return ProjectListResponse(
        projects=project_responses,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get a specific project by ID
    
    Requires authentication and project access
    """
    project = await get_project_by_id(project_id, current_user, db)
    
    # Get owner
    owner = await db.users.find_one({"_id": project["owner"]})
    
    # Get collaborators
    collaborators = []
    for collab in project.get("collaborators", []):
        user = await db.users.find_one({"_id": collab["user"]})
        if user:
            collaborators.append({
                "_id": str(user["_id"]),
                "username": user["username"],
                "email": user["email"],
                "role": collab["role"],
                "added_at": collab["added_at"]
            })
    
    return ProjectResponse(
        _id=str(project["_id"]),
        name=project["name"],
        description=project.get("description"),
        owner={
            "_id": str(owner["_id"]),
            "username": owner["username"],
            "email": owner["email"]
        },
        requirements=project["requirements"],
        status=ProjectStatus(project["status"]),
        floor_plan_data=project.get("floor_plan_data"),
        map_data=project.get("map_data"),
        pricing=project.get("pricing"),
        collaborators=collaborators,
        tags=project.get("tags", []),
        created_at=project["created_at"],
        updated_at=project["updated_at"]
    )


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update a project
    
    Requires authentication and project owner/editor access
    """
    project = await get_project_by_id(project_id, current_user, db)
    
    # Build update data
    update_data = {}
    if project_update.name is not None:
        update_data["name"] = project_update.name
    if project_update.description is not None:
        update_data["description"] = project_update.description
    if project_update.requirements is not None:
        update_data["requirements"] = project_update.requirements.model_dump()
    if project_update.floor_plan_data is not None:
        update_data["floor_plan_data"] = project_update.floor_plan_data.model_dump()
    if project_update.map_data is not None:
        update_data["map_data"] = project_update.map_data
    if project_update.pricing is not None:
        update_data["pricing"] = project_update.pricing
    if project_update.status is not None:
        update_data["status"] = project_update.status.value
    
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        update_data["last_modified_by"] = current_user.id
        
        await db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": update_data}
        )
    
    # Get updated project
    return await get_project(project_id, current_user, db)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Delete a project
    
    Requires authentication and project ownership
    """
    project = await get_project_by_id(project_id, current_user, db)
    
    # Only owner can delete
    if project["owner"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project owner can delete the project"
        )
    
    # Delete project
    await db.projects.delete_one({"_id": ObjectId(project_id)})
    
    # Remove from user's projects list
    await db.users.update_one(
        {"_id": current_user.id},
        {"$pull": {"projects": ObjectId(project_id)}}
    )
    
    return None
