# Restmage Testing Suite

Comprehensive testing infrastructure for the Restmage real estate planning application.

## 📁 Directory Structure

```
testing/
├── backend/                 # Backend/Server tests
│   ├── integration/        # API integration tests (manual scripts)
│   │   ├── test-simple.js
│   │   ├── test-new-endpoints.js
│   │   ├── test-summary.js
│   │   ├── test-endpoints.js
│   │   ├── test-chatbot.js
│   │   ├── test-mongodb-storage.js
│   │   └── test-frontend-format.js
│   ├── unit/               # Unit tests for services/utilities
│   │   └── test-refactored-code.js
│   ├── debug/              # Debug scripts
│   │   └── debug-auth.js
│   └── external/           # External API tests
│       └── test-openai-direct.js
├── frontend/               # Frontend/Client tests
│   ├── components/         # React component tests
│   │   ├── Dashboard.test.tsx
│   │   └── FloorPlanGenerator.test.tsx
│   ├── services/           # Service/API tests
│   │   ├── api.test.ts
│   │   └── geminiFloorPlan.test.ts
│   └── README.md
├── utils/                  # Shared testing utilities
│   ├── testHelpers.js      # Common test helpers
│   ├── dbHelpers.js        # Database setup/teardown
│   ├── mockData.js         # Mock data generators
│   └── envValidator.js     # Environment validation
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

Before running tests, ensure you have:

1. **MongoDB** running (local or cloud)
2. **Server** running on `http://localhost:5000`
3. **Environment variables** configured in `server/.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/restmage
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

### Running Tests

#### From Root Directory

```bash
# Run all tests (Jest + manual)
npm test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend

# Run manual integration tests
npm run test:backend:manual

# Run comprehensive integration tests
npm run test:backend:integration

# Run unit tests
npm run test:backend:unit
```

#### From Server Directory

```bash
cd server

# Jest tests (when available)
npm test

# Manual integration tests
npm run test:manual
npm run test:integration
npm run test:unit
```

#### From Client Directory

```bash
cd client

# Jest tests with React Testing Library
npm test

# Coverage report
npm test -- --coverage --watchAll=false
```

## 📋 Test Types

### 1. Backend Integration Tests (Manual)

Located in `testing/backend/integration/`

These are manual Node.js scripts that test API endpoints end-to-end:

**test-summary.js** - Comprehensive test suite with pass/fail summary
```bash
node testing/backend/integration/test-summary.js
```

**test-new-endpoints.js** - Tests 3-dataset architecture endpoints
```bash
node testing/backend/integration/test-new-endpoints.js
```

**test-simple.js** - Simple end-to-end workflow test
```bash
node testing/backend/integration/test-simple.js
```

**test-endpoints.js** - Detailed endpoint testing with verbose output
```bash
node testing/backend/integration/test-endpoints.js
```

**test-chatbot.js** - Chatbot/AI assistant functionality
```bash
node testing/backend/integration/test-chatbot.js
```

**test-mongodb-storage.js** - Direct MongoDB verification
```bash
node testing/backend/integration/test-mongodb-storage.js
```

**test-frontend-format.js** - Frontend-backend data format compatibility
```bash
node testing/backend/integration/test-frontend-format.js
```

### 2. Backend Unit Tests

Located in `testing/backend/unit/`

**test-refactored-code.js** - Tests Gemini AI service modules
```bash
node testing/backend/unit/test-refactored-code.js
```

### 3. Debug Scripts

Located in `testing/backend/debug/`

**debug-auth.js** - Debug authorization and ownership issues
```bash
node testing/backend/debug/debug-auth.js
```

### 4. External API Tests

Located in `testing/backend/external/`

**test-openai-direct.js** - Direct OpenAI API testing (bypasses server)
```bash
node testing/backend/external/test-openai-direct.js
```
Requires `OPENAI_API_KEY` in environment.

### 5. Frontend Tests

Located in `testing/frontend/`

React component and service tests using Jest + React Testing Library.

See `testing/frontend/README.md` for detailed frontend testing guide.

## 🧰 Shared Utilities

### Test Helpers (`utils/testHelpers.js`)

Common utilities for test scripts:

```javascript
const {
  generateTestUser,
  registerTestUser,
  loginTestUser,
  createAuthenticatedClient,
  formatTestResult,
  printTestSection,
  checkServerHealth
} = require('../utils/testHelpers');

// Example usage
const { user, token } = await registerTestUser();
const apiClient = createAuthenticatedClient(token);
```

### Database Helpers (`utils/dbHelpers.js`)

Database setup/teardown utilities:

```javascript
const {
  connectTestDB,
  disconnectTestDB,
  clearCollection,
  printDatabaseStats,
  cleanupTestData
} = require('../utils/dbHelpers');

// Example usage
await connectTestDB();
await clearCollection('users');
await printDatabaseStats();
await disconnectTestDB();
```

### Mock Data Generators (`utils/mockData.js`)

Consistent test data generation:

```javascript
const {
  generateMockProject,
  generateMockFloorPlan,
  generateMockUser,
  generateMockCostEstimate
} = require('../utils/mockData');

// Example usage
const project = generateMockProject({ name: 'Custom Name' });
const floorPlan = generateMockFloorPlan(projectId);
```

### Environment Validator (`utils/envValidator.js`)

Validate environment setup:

```javascript
const { validateAndLoad } = require('../utils/envValidator');

// Validates and exits if required vars missing
validateAndLoad(true);
```

## ⚙️ Test Configuration

### Backend Jest Config

Configured in `server/package.json`:

```json
{
  "jest": {
    "testEnvironment": "node"
  }
}
```

### Frontend Jest Config

Inherited from Create React App with Testing Library presets.

### Future: Dedicated Jest Configs

- `testing/backend/jest.config.js` - Backend test configuration
- `testing/frontend/jest.config.js` - Frontend test configuration

## 📊 Test Coverage

### Current Status

- **Backend Jest Tests**: 0 (manual tests only)
- **Frontend Jest Tests**: 0 (templates provided)
- **Manual Integration Tests**: 7 files
- **Unit Tests**: 1 file
- **Debug Scripts**: 1 file
- **External Tests**: 1 file

### Roadmap

- [ ] Convert manual tests to Jest + Supertest
- [ ] Write backend unit tests for all services
- [ ] Write frontend component tests
- [ ] Add E2E tests (Playwright/Cypress)
- [ ] Set up CI/CD test pipeline
- [ ] Add test coverage reporting
- [ ] Implement visual regression testing

## 🔧 Writing New Tests

### Backend Manual Test Template

```javascript
const axios = require('axios');
const { validateAndLoad, registerTestUser } = require('../utils/testHelpers');

// Validate environment
validateAndLoad();

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  try {
    console.log('Starting tests...\n');
    
    // Register test user
    const { user, token } = await registerTestUser(BASE_URL);
    
    // Your test logic here
    
    console.log('\n✅ All tests passed');
  } catch (error) {
    console.error('\n❌ Tests failed:', error.message);
    process.exit(1);
  }
}

runTests();
```

### Backend Jest Test Template

```javascript
const request = require('supertest');
const app = require('../server/server');

describe('API Endpoints', () => {
  let token;
  
  beforeAll(async () => {
    // Setup
  });
  
  afterAll(async () => {
    // Cleanup
  });
  
  test('GET /api/projects should return projects', async () => {
    const response = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('projects');
  });
});
```

### Frontend Component Test Template

See `testing/frontend/components/` for detailed examples.

## 🐛 Troubleshooting

### Common Issues

#### 1. "MongoDB connection failed"
- **Solution**: Ensure MongoDB is running: `mongod` or check cloud connection
- Verify `MONGODB_URI` in `.env`

#### 2. "ECONNREFUSED localhost:5000"
- **Solution**: Start the server: `npm run server` from root

#### 3. "Missing required environment variables"
- **Solution**: Create `server/.env` from `server/.env.example`
- Set all required variables (see Prerequisites)

#### 4. "GEMINI_API_KEY is not set"
- **Solution**: Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Add to `server/.env`: `GEMINI_API_KEY=your_key_here`

#### 5. "Test creates duplicate users"
- **Solution**: Tests create random users (testuser1234@test.com)
- Clean up: `node testing/utils/cleanupTestData.js` (create this script)

#### 6. "Jest finds no tests"
- **Reason**: No `*.test.js` or `*.spec.js` files exist yet
- Manual tests use `.js` extension and run with `node`

### Debug Mode

Run tests with verbose output:

```bash
# Backend manual tests (already verbose)
node testing/backend/integration/test-endpoints.js

# Frontend Jest tests
cd client
npm test -- --verbose
```

### Database Inspection

Use the database stats helper:

```javascript
const { connectTestDB, printDatabaseStats } = require('./testing/utils/dbHelpers');

(async () => {
  await connectTestDB();
  await printDatabaseStats();
  process.exit(0);
})();
```

## 📚 Best Practices

### ✅ DO

- **Isolate tests** - Each test should be independent
- **Use helpers** - Leverage `testing/utils/` for common operations
- **Clean up** - Remove test data after tests complete
- **Mock external APIs** - Don't hit real services in tests
- **Test error cases** - Not just happy paths
- **Use descriptive names** - Test names should explain what they test
- **Validate environment** - Always check required vars before running

### ❌ DON'T

- **Hardcode credentials** - Use environment variables
- **Share state** - Tests should not depend on execution order
- **Test implementation** - Test behavior, not internals
- **Leave test data** - Always cleanup after tests
- **Skip error handling** - Always test failure scenarios
- **Use production data** - Always use test/mock data

## 🔒 Security Notes

- **Never commit** `.env` files with real credentials
- **Use test accounts** for integration tests
- **Rotate API keys** if accidentally exposed
- **Sanitize logs** - Don't log sensitive data in test output
- **Separate environments** - Use dedicated test database

## 📖 Resources

### Documentation
- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [React Testing Library](https://testing-library.com/react)
- [Mongoose Testing](https://mongoosejs.com/docs/jest.html)

### Restmage-Specific
- `testing/frontend/README.md` - Frontend testing guide
- `server/README.md` - Server setup and API documentation
- `client/README.md` - Client setup and development

## 🤝 Contributing

When adding new tests:

1. **Backend manual tests** → `testing/backend/integration/`
2. **Backend unit tests** → `testing/backend/unit/`
3. **Frontend tests** → Follow patterns in `testing/frontend/`
4. **Shared utilities** → Add to `testing/utils/`
5. **Update this README** with new test commands

## 📞 Support

For issues with tests:

1. Check troubleshooting section above
2. Verify environment setup (prerequisites)
3. Review test output for specific errors
4. Check server logs: `server/logs/`

---

**Last Updated**: November 22, 2025  
**Version**: 1.0.0  
**Maintainer**: Restmage Development Team
