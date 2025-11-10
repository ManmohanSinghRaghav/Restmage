"""Router package exports for the trimmed FastAPI application."""

from . import auth, floorplan, maps, predictor

__all__ = [
    "auth",
    "floorplan",
    "maps",
    "predictor",
]
