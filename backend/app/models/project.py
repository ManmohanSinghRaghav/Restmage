"""
Pydantic Models - Project
Data validation and serialization for Project entity
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
from bson import ObjectId


class ProjectStatus(str, Enum):
    """Project status enumeration"""
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class RoomType(str, Enum):
    """Room type enumeration"""
    BEDROOM = "bedroom"
    BATHROOM = "bathroom"
    KITCHEN = "kitchen"
    LIVING_ROOM = "living_room"
    DINING_ROOM = "dining_room"
    OFFICE = "office"
    GARAGE = "garage"
    BALCONY = "balcony"
    CUSTOM = "custom"


class Room(BaseModel):
    """Room model"""
    name: str
    type: RoomType
    length: float = Field(..., gt=0)
    width: float = Field(..., gt=0)
    area: Optional[float] = None
    floor: int = Field(default=1, ge=1)
    
    def calculate_area(self):
        """Calculate room area"""
        self.area = self.length * self.width
        return self.area


class PlotDimensions(BaseModel):
    """Plot dimensions model"""
    length: float = Field(..., gt=0)
    width: float = Field(..., gt=0)
    area: Optional[float] = None
    unit: str = Field(default="feet")
    
    def calculate_area(self):
        """Calculate plot area"""
        self.area = self.length * self.width
        return self.area


class ProjectRequirements(BaseModel):
    """Project requirements model"""
    plot_length: float = Field(..., gt=0)
    plot_width: float = Field(..., gt=0)
    floors: int = Field(default=1, ge=1, le=10)
    bedrooms: int = Field(default=2, ge=0, le=20)
    bathrooms: int = Field(default=2, ge=0, le=20)
    rooms: List[Room] = []
    budget: Optional[float] = Field(None, ge=0)
    style: Optional[str] = None
    special_features: List[str] = []


class Collaborator(BaseModel):
    """Collaborator model"""
    user: str  # User ID as string
    role: str = "viewer"
    added_at: datetime = Field(default_factory=datetime.utcnow)


class FloorPlanData(BaseModel):
    """Floor plan data model"""
    plot_dimensions: PlotDimensions
    rooms: List[Room]
    walls: List[Dict[str, Any]] = []
    doors: List[Dict[str, Any]] = []
    windows: List[Dict[str, Any]] = []
    furniture: List[Dict[str, Any]] = []
    metadata: Dict[str, Any] = {}


class ProjectBase(BaseModel):
    """Base project model"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    requirements: ProjectRequirements
    status: ProjectStatus = ProjectStatus.DRAFT


class ProjectCreate(ProjectBase):
    """Model for project creation"""
    pass


class ProjectUpdate(BaseModel):
    """Model for project updates"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    requirements: Optional[ProjectRequirements] = None
    floor_plan_data: Optional[FloorPlanData] = None
    map_data: Optional[Dict[str, Any]] = None
    pricing: Optional[Dict[str, Any]] = None
    status: Optional[ProjectStatus] = None


class ProjectInDB(ProjectBase):
    """Project model as stored in database"""
    id: Optional[str] = Field(default=None, alias="_id")
    owner: str  # Owner user ID as string
    collaborators: List[Collaborator] = []
    floor_plan_data: Optional[FloorPlanData] = None
    map_data: Optional[Dict[str, Any]] = None
    pricing: Optional[Dict[str, Any]] = None
    tags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_modified_by: Optional[str] = None  # User ID as string
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }
    }


class ProjectResponse(BaseModel):
    """Project response model"""
    id: str = Field(..., alias="_id")
    name: str
    description: Optional[str]
    owner: Dict[str, Any]  # Populated user data
    requirements: ProjectRequirements
    status: ProjectStatus
    floor_plan_data: Optional[FloorPlanData]
    map_data: Optional[Dict[str, Any]]
    pricing: Optional[Dict[str, Any]]
    collaborators: List[Dict[str, Any]] = []
    tags: List[str] = []
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "populate_by_name": True,
        "json_encoders": {
            datetime: lambda v: v.isoformat()
        }
    }


class ProjectListResponse(BaseModel):
    """Paginated project list response"""
    projects: List[ProjectResponse]
    total: int
    page: int
    limit: int
    total_pages: int
