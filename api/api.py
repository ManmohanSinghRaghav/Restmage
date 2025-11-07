from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import google.generativeai as genai
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import the schema classes from restmage
from restmage import (
    FloorPlan, MapInfo, Point, Room, Wall, Door, Window, Stair, Fixture, PlotSummary,
    create_architect_prompt, get_api_key
)

app = FastAPI(
    title="Floor Plan Generator API",
    description="AI-powered architectural floor plan generation using Gemini",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model for floor plan generation
class FloorPlanRequest(BaseModel):
    plot_width_ft: float = Field(default=30.0, description="Width of the plot in feet")
    plot_length_ft: float = Field(default=50.0, description="Length of the plot in feet")
    entrance_facing: str = Field(default="North", description="Direction the entrance faces")
    setback_front_ft: float = Field(default=5.0, description="Front setback in feet")
    setback_rear_ft: float = Field(default=3.0, description="Rear setback in feet")
    setback_side_left_ft: float = Field(default=3.0, description="Left side setback in feet")
    setback_side_right_ft: float = Field(default=3.0, description="Right side setback in feet")
    rooms: str = Field(default="2 Bedrooms, 2 Bathrooms, 1 Living Room, 1 Kitchen, 1 Pooja Room", 
                      description="Comma-separated list of required rooms")
    floors: int = Field(default=1, description="Number of floors")

# Response model
class FloorPlanResponse(BaseModel):
    success: bool
    message: str
    floor_plan: Optional[dict] = None

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Floor Plan Generator API",
        "version": "1.0.0",
        "endpoints": {
            "/generate": "POST - Generate a floor plan",
            "/health": "GET - Check API health",
            "/docs": "GET - API documentation"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Floor Plan Generator API"}

@app.post("/generate", response_model=FloorPlanResponse)
async def generate_floor_plan(request: FloorPlanRequest):
    """
    Generate a complete floor plan based on the provided specifications.
    Returns a JSON response with the complete floor plan data.
    """
    try:
        # Prepare user inputs
        user_inputs = {
            "plot_width_ft": request.plot_width_ft,
            "plot_length_ft": request.plot_length_ft,
            "entrance_facing": request.entrance_facing,
            "setback_front_ft": request.setback_front_ft,
            "setback_rear_ft": request.setback_rear_ft,
            "setback_side_left_ft": request.setback_side_left_ft,
            "setback_side_right_ft": request.setback_side_right_ft,
            "rooms": request.rooms,
            "floors": request.floors
        }

        # Configure the API
        api_key = get_api_key()
        if not api_key:
            raise HTTPException(
                status_code=500, 
                detail="GOOGLE_API_KEY not found in environment variables"
            )
        
        genai.configure(api_key=api_key)

        # Create the prompt
        prompt = create_architect_prompt(user_inputs)

        # Configure generation
        generation_config = genai.types.GenerationConfig(
            response_mime_type="application/json",
            response_schema=FloorPlan,
        )

        # Use Gemini model
        model = genai.GenerativeModel('gemini-2.5-flash')

        # Generate the floor plan (without streaming for API response)
        response = model.generate_content(
            prompt,
            generation_config=generation_config,
            stream=False
        )

        # Extract the response text
        if response.parts and response.parts[0].text:
            floor_plan_json = response.parts[0].text
        elif response.text:
            floor_plan_json = response.text
        else:
            raise HTTPException(
                status_code=500,
                detail="No response generated from the AI model"
            )

        # Parse the JSON to validate it
        floor_plan_data = json.loads(floor_plan_json)

        return FloorPlanResponse(
            success=True,
            message="Floor plan generated successfully",
            floor_plan=floor_plan_data
        )

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid JSON response from AI model: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating floor plan: {str(e)}"
        )

@app.post("/generate-stream")
async def generate_floor_plan_stream(request: FloorPlanRequest):
    """
    Generate a floor plan with streaming response.
    Note: This endpoint returns the complete JSON after streaming is complete.
    """
    try:
        # Prepare user inputs
        user_inputs = {
            "plot_width_ft": request.plot_width_ft,
            "plot_length_ft": request.plot_length_ft,
            "entrance_facing": request.entrance_facing,
            "setback_front_ft": request.setback_front_ft,
            "setback_rear_ft": request.setback_rear_ft,
            "setback_side_left_ft": request.setback_side_left_ft,
            "setback_side_right_ft": request.setback_side_right_ft,
            "rooms": request.rooms,
            "floors": request.floors
        }

        # Configure the API
        api_key = get_api_key()
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="GOOGLE_API_KEY not found in environment variables"
            )
        
        genai.configure(api_key=api_key)

        # Create the prompt
        prompt = create_architect_prompt(user_inputs)

        # Configure generation
        generation_config = genai.types.GenerationConfig(
            response_mime_type="application/json",
            response_schema=FloorPlan,
        )

        # Use Gemini model
        model = genai.GenerativeModel('gemini-2.5-flash')

        # Generate with streaming
        response_stream = model.generate_content(
            prompt,
            generation_config=generation_config,
            stream=True
        )

        # Collect the full response
        full_response_text = ""
        for chunk in response_stream:
            if chunk.parts and chunk.parts[0].text:
                full_response_text += chunk.parts[0].text
            elif chunk.text:
                full_response_text += chunk.text

        # Parse and return the complete JSON
        floor_plan_data = json.loads(full_response_text)

        return FloorPlanResponse(
            success=True,
            message="Floor plan generated successfully (streamed)",
            floor_plan=floor_plan_data
        )

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid JSON response from AI model: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating floor plan: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
