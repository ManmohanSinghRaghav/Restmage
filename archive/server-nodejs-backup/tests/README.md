# Backend Testing Structure

## 📁 Folder Organization

```
server/tests/
├── unit/               # Unit tests (isolated function/middleware tests)
├── integration/        # Integration tests (API routes with mocked dependencies)
├── e2e/               # End-to-end tests (full API flows with real database)
├── fixtures/          # Sample test data
└── utils/             # Testing utilities and helpers
```

## 📝 Test Types

### Unit Tests (`unit/`)
Tests individual functions, middleware, and utilities in isolation.

**Example files:**
- `auth.middleware.test.js` - JWT authentication middleware tests
- `validateObjectId.middleware.test.js` - MongoDB ID validation tests
- `logger.test.js` - Winston logger configuration tests

**Characteristics:**
- Fast execution
- No external dependencies (databases, APIs)
- Uses mocks and stubs
- Tests single responsibility

### Integration Tests (`integration/`)
Tests API routes with mocked external services but real business logic.

**Example files:**
- `gemini-export.test.js` - Gemini AI and PDF export integration
- `auth.routes.test.js` - Authentication route integration
- `projects.routes.test.js` - Project CRUD integration

**Characteristics:**
- Medium execution speed
- Mocks external APIs (Gemini, third-party services)
- May use in-memory database
- Tests route + middleware + controller

### E2E Tests (`e2e/`)
Tests complete user workflows from API request to database response.

**Example files:**
- `api.test.js` - Full API endpoint testing
- `user-workflow.test.js` - Register → Login → Create Project → Export
- `real-time.test.js` - WebSocket collaboration testing

**Characteristics:**
- Slower execution
- Uses test database (separate from production)
- Real HTTP requests via Supertest
- Tests entire stack

## 🛠️ Utilities (`utils/`)

### `testSetup.js`
Database connection management for tests:
- `connectTestDB()` - Connect to test database
- `clearDatabase()` - Clear all collections between tests
- `closeDatabase()` - Close connection after tests

### `mockAuth.js`
Authentication mocking utilities:
- `createMockUser()` - Generate test user object
- `generateTestToken()` - Create valid JWT token
- `mockAuthMiddleware()` - Bypass authentication in tests
- `authHeader()` - Generate Authorization header

## 📦 Fixtures (`fixtures/`)

### `sampleData.js`
Reusable test data:
- `sampleUser` - Test user credentials
- `sampleProject` - Test floor plan project
- `sampleFloorPlanRequirements` - AI generation input
- `samplePricePrediction` - Price prediction input
- `sampleGeminiResponse` - Mock AI response

## 🚀 Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm test -- --watch
```

### Specific Test Type
```bash
npm test -- unit
npm test -- integration
npm test -- e2e
```

### With Coverage
```bash
npm test -- --coverage
```

### Single File
```bash
npm test -- auth.middleware.test.js
```

## 📋 Test Naming Convention

- **Unit tests**: `<module>.test.js` or `<module>.spec.js`
- **Integration tests**: `<feature>.integration.test.js`
- **E2E tests**: `<workflow>.e2e.test.js`

## 🔧 Configuration

Jest configuration in `server/package.json`:
```json
{
  "jest": {
    "testEnvironment": "node",
    "testMatch": ["**/tests/**/*.test.js"],
    "collectCoverageFrom": [
      "routes/**/*.js",
      "middleware/**/*.js",
      "models/**/*.js",
      "utils/**/*.js"
    ],
    "coveragePathIgnorePatterns": ["/node_modules/", "/tests/"]
  }
}
```

## 📊 Best Practices

1. **Arrange-Act-Assert Pattern**
   ```js
   it('should do something', () => {
     // Arrange - setup test data
     const input = { ... };
     
     // Act - execute function
     const result = myFunction(input);
     
     // Assert - verify result
     expect(result).toBe(expected);
   });
   ```

2. **Use beforeEach/afterEach for Setup**
   ```js
   beforeEach(() => {
     // Reset mocks, clear database
   });
   
   afterEach(() => {
     // Cleanup
   });
   ```

3. **Descriptive Test Names**
   - ✅ `should return 401 if no token provided`
   - ❌ `test auth`

4. **Test Edge Cases**
   - Valid input
   - Invalid input
   - Missing input
   - Boundary conditions

5. **Mock External Dependencies**
   - Database calls (unit tests)
   - External APIs (Gemini, etc.)
   - File system operations
   - Date/time functions

## 🔍 Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Cover all API routes
- **E2E Tests**: Cover critical user workflows

## 🐛 Debugging Tests

### Run with Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### VS Code Debug Configuration
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
