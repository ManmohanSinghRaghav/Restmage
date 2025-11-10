# Backend Tests

Comprehensive test suite for Restmage FastAPI backend.

## Test Structure

```
tests/
├── conftest.py              # Test configuration and fixtures
├── test_ml_service.py       # Unit tests for ML service
└── test_predictor_api.py    # Integration tests for Predictor API
```

## Running Tests

### Prerequisites

Install test dependencies:
```bash
pip install -r requirements.txt
```

### Run All Tests

```bash
# Using pytest directly
pytest tests/ -v

# Using test runner script
python run_tests.py
```

### Run Specific Test Types

```bash
# Unit tests only (ML Service)
python run_tests.py unit

# Integration tests only (API endpoints)
python run_tests.py integration
```

### With Coverage Report

```bash
# Generate coverage report
python run_tests.py --coverage

# View HTML coverage report
# Open: htmlcov/index.html
```

### Verbose Output

```bash
python run_tests.py --verbose
```

## Test Categories

### 1. Unit Tests (`test_ml_service.py`)

Tests for ML Service business logic:
- ✅ Service initialization
- ✅ Heuristic prediction with various features
- ✅ Location premium calculations
- ✅ Condition adjustments
- ✅ Amenity contributions
- ✅ Age calculations from yearBuilt
- ✅ Garage handling (boolean/string/amenities)
- ✅ Async predict method
- ✅ Batch prediction (empty, single, multiple)
- ✅ Market trends retrieval

### 2. Integration Tests (`test_predictor_api.py`)

Tests for API endpoints:
- ✅ Health check endpoint
- ✅ Authentication requirements
- ✅ Single prediction with valid/invalid data
- ✅ Minimal vs full feature sets
- ✅ Missing required fields validation
- ✅ Batch prediction (empty, single, multiple, too many)
- ✅ Market trends endpoint
- ✅ Location variation impact
- ✅ Condition variation impact

## Test Fixtures

### Available Fixtures (from `conftest.py`)

- `event_loop`: Event loop for async tests
- `test_db`: Test database connection
- `async_client`: Async HTTP client
- `client`: Synchronous test client
- `sample_user`: Sample user data
- `sample_property`: Sample property features
- `sample_project`: Sample project data
- `auth_headers`: Authentication headers for tests

## Test Coverage Goals

- **Unit Tests**: ≥ 90% coverage for `app/services/`
- **Integration Tests**: ≥ 80% coverage for `app/routers/`
- **Overall**: ≥ 85% coverage

## Writing New Tests

### Unit Test Example

```python
import pytest
from app.services.ml_service import MLService

@pytest.mark.asyncio
async def test_new_feature():
    ml_service = MLService()
    result = await ml_service.predict(features)
    assert result["success"] is True
```

### Integration Test Example

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_new_endpoint(async_client: AsyncClient, auth_headers):
    response = await async_client.post(
        "/api/predictor/predict",
        json=payload,
        headers=auth_headers
    )
    assert response.status_code == 200
```

## Continuous Integration

Tests should be run in CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: |
    pip install -r requirements.txt
    pytest tests/ -v --cov=app --cov-report=xml
```

## Troubleshooting

### Import Errors

Ensure backend is in PYTHONPATH:
```bash
# Windows
$env:PYTHONPATH = "r:\MiniPro\Restmage\backend"

# Linux/Mac
export PYTHONPATH=/path/to/backend
```

### Database Connection Errors

Tests use a separate test database (`restmage_test`). Ensure MongoDB is running:
```bash
# Check MongoDB status
mongod --version
```

### Async Test Errors

Install pytest-asyncio:
```bash
pip install pytest-asyncio
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use fixtures to clean up test data
3. **Descriptive Names**: Test names should describe what they test
4. **Assertions**: Use clear, specific assertions
5. **Coverage**: Aim for high coverage but focus on meaningful tests
6. **Speed**: Keep unit tests fast (< 1s each)
7. **Documentation**: Document complex test scenarios

## Next Steps

- [ ] Add tests for authentication endpoints
- [ ] Add tests for project CRUD endpoints
- [ ] Add performance/load tests
- [ ] Add end-to-end tests
- [ ] Set up CI/CD integration
- [ ] Increase test coverage to 90%+
