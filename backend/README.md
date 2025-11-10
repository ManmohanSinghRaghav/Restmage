# Restmage FastAPI Backend

Modern, high-performance backend server built with FastAPI for the Restmage real estate floor plan generation application.

## 🚀 Features

- ⚡ **FastAPI Framework** - Modern, fast Python web framework
- 🔒 **JWT Authentication** - Secure token-based authentication
- 📊 **MongoDB Async** - Motor driver for async MongoDB operations
- 🎯 **Pydantic Models** - Type-safe data validation
- 📚 **Auto-Generated API Docs** - Swagger UI and ReDoc
- 🔐 **Security** - CORS, rate limiting, password hashing
- 🧪 **Async/Await** - Non-blocking async operations
- 📝 **Logging Middleware** - Request/response logging with timing
- 🤖 **ML Price Predictor** - Intelligent property price predictions with ML model and heuristic fallback

## 📋 Requirements

- **Python**: 3.8+ (3.11+ recommended)
- **MongoDB**: 5.0+ (local or Atlas)
- **pip**: Latest version

## ⚙️ Installation

### 1. Create Virtual Environment

```powershell
# Windows (PowerShell)
cd fastapi-server
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

```bash
# Copy example environment file
copy .env.example .env

# Edit .env file with your configuration
notepad .env
```

**Important**: Change `JWT_SECRET` to a secure random string in production!

### 4. Start MongoDB

```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env with your Atlas connection string
```

## 🎯 Running the Server

### Development Mode (with auto-reload)

```bash
# Option 1: Using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 5000

# Option 2: Using Python
python main.py
```

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 5000 --workers 4
```

## 📚 API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:5000/api/docs
- **ReDoc**: http://localhost:5000/api/redoc
- **OpenAPI JSON**: http://localhost:5000/api/openapi.json

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/verify-token` - Verify JWT token

### Projects
- `POST /api/projects` - Create new project
- `GET /api/projects` - Get all user projects (with pagination)
- `GET /api/projects/{id}` - Get specific project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### ML Price Predictor (NEW! ✨)
- `POST /api/predictor/predict` - **Single property price prediction**
- `POST /api/predictor/batch-predict` - **Batch property price prediction**
- `GET /api/predictor/market-trends` - **Get market trends and insights**
- `GET /api/predictor/health` - **Check ML service health status**

### Other Endpoints
- `POST /api/cost/estimate` - Cost estimation *(coming soon)*
- `GET /api/maps/location` - Map services *(coming soon)*
- `POST /api/export/pdf` - Export to PDF *(coming soon)*
- `POST /api/floorplan/generate` - Generate floor plan *(coming soon)*
- `POST /api/price-prediction/predict` - Legacy price prediction *(deprecated - use /api/predictor/predict)*
- `POST /api/chatbot/message` - AI chatbot *(coming soon)*
- `POST /api/gemini/generate` - Gemini AI generation *(coming soon)*

## 🧪 Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py
```

## 📂 Project Structure

```
fastapi-server/
├── main.py                      # FastAPI application entry point
├── requirements.txt             # Python dependencies
├── .env.example                 # Example environment variables
├── .env                         # Your environment variables (not in git)
│
├── app/
│   ├── core/
│   │   ├── config.py           # Configuration settings
│   │   ├── database.py         # MongoDB connection
│   │   ├── security.py         # JWT & password hashing
│   │   └── deps.py             # FastAPI dependencies
│   │
│   ├── models/
│   │   ├── user.py             # User Pydantic models
│   │   └── project.py          # Project Pydantic models
│   │
│   ├── routers/
│   │   ├── auth.py             # Authentication routes
│   │   ├── projects.py         # Project CRUD routes
│   │   ├── predictor.py        # ML Price Predictor (NEW!)
│   │   ├── cost.py             # Cost estimation routes
│   │   ├── maps.py             # Map services routes
│   │   ├── export_routes.py   # Export functionality
│   │   ├── floorplan.py        # Floor plan generation
│   │   ├── price_prediction.py # Legacy price prediction (deprecated)
│   │   ├── chatbot.py          # AI chatbot
│   │   └── gemini.py           # Gemini AI integration
│   │
│   ├── services/
│   │   └── ml_service.py       # ML Prediction Service (NEW!)
│   │
│   ├── schemas/
│   │   └── prediction.py       # Prediction Pydantic schemas (NEW!)
│   │
│   └── middleware/
│       └── logging_middleware.py  # Request logging
│
├── models/                      # ML model files (NEW!)
│   ├── model.pkl               # Trained scikit-learn model
│   └── encoder.pkl             # Label encoders
│
└── tests/                       # Test files
    ├── conftest.py             # Test configuration
    ├── test_ml_service.py      # ML service unit tests (NEW!)
    └── test_predictor_api.py   # Predictor API integration tests (NEW!)
```

## 🤖 ML Price Predictor

The backend now includes an intelligent property price prediction system with:

### Features
- ✅ **ML Model Support** - Scikit-learn model integration (optional)
- ✅ **Heuristic Fallback** - Rule-based pricing when ML model unavailable
- ✅ **Batch Predictions** - Predict up to 100 properties at once
- ✅ **Market Insights** - Get market trends and pricing factors
- ✅ **Detailed Breakdown** - See price contributions from each feature
- ✅ **Auto-Validation** - Pydantic schemas validate all inputs

### Quick Example

```python
# Single property prediction
import requests

payload = {
    "features": {
        "area": 2000,
        "bedrooms": 3,
        "bathrooms": 2,
        "floors": 2,
        "yearBuilt": 2010,
        "location": "Urban",
        "condition": "Good",
        "garage": True,
        "amenities": ["garage", "garden"]
    }
}

response = requests.post(
    "http://localhost:5000/api/predictor/predict",
    json=payload,
    headers={"Authorization": f"Bearer {token}"}
)

result = response.json()
print(f"Estimated Price: ₹{result['prediction']['estimatedPrice']:,}")
print(f"Model Used: {result['modelUsed']}")
```

### Response Example

```json
{
  "success": true,
  "prediction": {
    "estimatedPrice": 475000,
    "priceRange": {
      "min": 427500,
      "max": 522500
    },
    "confidence": 0.85,
    "breakdown": {
      "basePrice": 50000,
      "areaContribution": 200000,
      "bedroomContribution": 45000,
      "bathroomContribution": 20000,
      "floorsContribution": 7500,
      "ageAdjustment": -28000,
      "locationPremium": 50000,
      "conditionAdjustment": 20000,
      "garageContribution": 15000,
      "otherAmenitiesContribution": 10000
    }
  },
  "modelUsed": "heuristic",
  "currency": "INR",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### API Endpoints

#### 1. Single Prediction
```http
POST /api/predictor/predict
Authorization: Bearer <token>
Content-Type: application/json

{
  "features": {
    "area": 2000,
    "bedrooms": 3,
    "bathrooms": 2,
    "floors": 2,
    "yearBuilt": 2010,
    "location": "Urban",
    "condition": "Good",
    "garage": true
  }
}
```

#### 2. Batch Prediction
```http
POST /api/predictor/batch-predict
Authorization: Bearer <token>
Content-Type: application/json

{
  "properties": [
    { "area": 2000, "bedrooms": 3, ... },
    { "area": 1500, "bedrooms": 2, ... }
  ]
}
```

#### 3. Market Trends
```http
GET /api/predictor/market-trends
Authorization: Bearer <token>
```

#### 4. Health Check
```http
GET /api/predictor/health
```

### Using ML Models

**Option 1: Use Heuristic Model (Default)**
- No setup required
- Rule-based pricing
- 85% confidence
- Works immediately

**Option 2: Train Custom ML Model**
```python
# Train and save your model
import joblib
from sklearn.ensemble import RandomForestRegressor

model = RandomForestRegressor(n_estimators=100)
model.fit(X_train, y_train)

# Save to backend/models/
joblib.dump(model, 'backend/models/model.pkl')
joblib.dump(encoder, 'backend/models/encoder.pkl')

# Restart server - model loads automatically!
```

See `backend/models/README.md` for detailed model training instructions.

### Testing

```bash
# Run ML service unit tests
pytest tests/test_ml_service.py -v

# Run predictor API integration tests
pytest tests/test_predictor_api.py -v

# Run all tests with coverage
python run_tests.py --coverage
```

## 🔐 Security Features

✅ **JWT Authentication** - Secure token-based auth  
✅ **Password Hashing** - Bcrypt with configurable rounds  
✅ **CORS Protection** - Configurable allowed origins  
✅ **Rate Limiting** - Prevent abuse with slowapi  
✅ **Input Validation** - Pydantic models validate all input  
✅ **SQL Injection Protection** - MongoDB with proper sanitization  
✅ **Helmet-like Security** - Security headers in production  

## 🚀 Performance

- **Async/Await**: Non-blocking I/O operations
- **Connection Pooling**: MongoDB connection pool (10-100 connections)
- **Fast Serialization**: Pydantic for efficient JSON serialization
- **Auto-scaling**: Deploy with multiple workers for high traffic

## 📊 Monitoring

The server includes:
- Request/response logging with timing
- X-Process-Time header on all responses
- Health check endpoint: `GET /api/health`

## 🔄 Migration from Node.js

This FastAPI backend replaces the Express.js (Node.js) backend with:

| Node.js | FastAPI | Benefit |
|---------|---------|---------|
| Express | FastAPI | Auto-generated API docs, type safety |
| Mongoose | Motor | Async MongoDB driver, better performance |
| JWT library | python-jose | Standard JWT implementation |
| bcrypt | passlib[bcrypt] | Secure password hashing |
| Socket.IO | WebSockets | Native WebSocket support |
| express-validator | Pydantic | Automatic validation with types |

## 🛠️ Development

### Code Formatting

```bash
# Format code with black
black app/

# Lint with flake8
flake8 app/

# Type checking with mypy
mypy app/
```

### Database Indexes

Indexes are created automatically on startup:
- `users.email` (unique)
- `users.username` (unique)
- `projects.owner`
- `projects.status`
- `projects` full-text search on name and description

## 📞 Support

For issues or questions:
- GitHub Issues: [Restmage Repository](https://github.com/ManmohanSinghRaghav/Restmage/issues)
- Documentation: See main `REQUIREMENTS.md` in project root

## 📄 License

MIT License - See LICENSE file in project root

---

**Built with FastAPI 🚀**  
**High Performance • Type Safe • Production Ready**
