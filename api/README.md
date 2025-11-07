# Floor Plan Generator API

AI-powered architectural floor plan generation API using Google Gemini and FastAPI.

## Features

- 🏗️ Generate complete architectural floor plans with Vastu compliance
- 🔄 RESTful API with JSON responses
- 📊 Includes rooms, walls, doors, windows, stairs, and fixtures
- 🌐 CORS enabled for frontend integration
- 📝 Interactive API documentation with Swagger UI

## Setup

### 1. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 2. Set Environment Variable

Set your Google API key as an environment variable:

```powershell
$env:GOOGLE_API_KEY="your-google-api-key-here"
```

Or create a `.env` file:
```
GOOGLE_API_KEY=your-google-api-key-here
```

### 3. Run the API

```powershell
python api.py
```

Or use uvicorn directly:

```powershell
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`

## API Endpoints

### 1. Root Endpoint
- **GET** `/`
- Returns API information and available endpoints

### 2. Health Check
- **GET** `/health`
- Returns API health status

### 3. Generate Floor Plan
- **POST** `/generate`
- Generates a complete floor plan and returns JSON response

**Request Body:**
```json
{
  "plot_width_ft": 60.0,
  "plot_length_ft": 40.0,
  "entrance_facing": "west",
  "setback_front_ft": 3.0,
  "setback_rear_ft": 3.0,
  "setback_side_left_ft": 3.0,
  "setback_side_right_ft": 3.0,
  "rooms": "2 Bedrooms, 3 attached Bathrooms, 1 Living Room, 1 Temple, 1 Kitchen, 1 Guestroom",
  "floors": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Floor plan generated successfully",
  "floor_plan": {
    "map_info": {...},
    "plot_summary": {...},
    "rooms": [...],
    "walls": [...],
    "doors": [...],
    "windows": [...],
    "stairs": [...],
    "fixtures": [...]
  }
}
```

### 4. Generate Floor Plan (Streaming)
- **POST** `/generate-stream`
- Same as `/generate` but uses streaming internally (returns complete JSON)

## Interactive Documentation

Once the API is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Example Usage

### Using cURL (PowerShell)

```powershell
$body = @{
    plot_width_ft = 60.0
    plot_length_ft = 40.0
    entrance_facing = "west"
    setback_front_ft = 3.0
    setback_rear_ft = 3.0
    setback_side_left_ft = 3.0
    setback_side_right_ft = 3.0
    rooms = "2 Bedrooms, 3 attached Bathrooms, 1 Living Room, 1 Temple, 1 Kitchen, 1 Guestroom"
    floors = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/generate" -Method Post -Body $body -ContentType "application/json"
```

### Using Python requests

```python
import requests

url = "http://localhost:8000/generate"
data = {
    "plot_width_ft": 60.0,
    "plot_length_ft": 40.0,
    "entrance_facing": "west",
    "setback_front_ft": 3.0,
    "setback_rear_ft": 3.0,
    "setback_side_left_ft": 3.0,
    "setback_side_right_ft": 3.0,
    "rooms": "2 Bedrooms, 3 attached Bathrooms, 1 Living Room, 1 Temple, 1 Kitchen, 1 Guestroom",
    "floors": 1
}

response = requests.post(url, json=data)
floor_plan = response.json()
print(floor_plan)
```

## Project Structure

```
mageAPI/
├── api.py              # FastAPI application
├── restmage.py         # Core floor plan generation logic
├── requirements.txt    # Python dependencies
└── README.md          # This file
```

## Features of Generated Floor Plans

- ✅ Vastu Shastra compliance (for Indian architecture)
- ✅ Proper setback calculations
- ✅ Room placement optimization
- ✅ Wall generation with thickness
- ✅ Door and window placement
- ✅ Fixtures (toilets, sinks, kitchen appliances)
- ✅ Staircase generation (for multi-floor plans)
- ✅ Complete coordinate system (X, Y in feet)

## Error Handling

The API includes comprehensive error handling:
- Missing API key detection
- Invalid JSON responses
- AI generation failures
- Input validation errors

## License

This project is provided as-is for educational and commercial use.
