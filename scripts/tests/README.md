# Restmage Testing Guide

## 📁 Centralized Testing Structure

All tests are now organized in `scripts/tests/` for better management:

```
scripts/tests/
├── unit/
│   ├── client/          # Frontend unit tests
│   └── server/          # Backend unit tests
├── integration/         # API integration tests
├── e2e/                # End-to-end workflow tests
├── fixtures/           # Shared test data
├── utils/              # Testing utilities
└── run-all-tests.js    # Master test runner
```

## 🚀 Quick Start

### Run All Tests
```bash
node scripts/tests/run-all-tests.js
```

### Run Specific Test Types
```bash
node scripts/tests/run-all-tests.js --unit          # Unit tests only
node scripts/tests/run-all-tests.js --integration   # Integration tests
node scripts/tests/run-all-tests.js --e2e          # End-to-end tests
node scripts/tests/run-all-tests.js --coverage     # With coverage report
```

### Using npm Scripts
```bash
npm test                  # All tests
npm run test:unit         # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e         # E2E tests
npm run test:coverage    # With coverage
```

## 📝 Test Types Explained

### Unit Tests (`unit/`)
- **Purpose**: Test individual functions/components in isolation
- **Speed**: Fast (milliseconds)
- **Dependencies**: Mocked
- **Example**: Testing a single React component or a utility function

### Integration Tests (`integration/`)
- **Purpose**: Test multiple components working together
- **Speed**: Medium (seconds)
- **Dependencies**: Some real, some mocked
- **Example**: Testing API routes with real business logic

### E2E Tests (`e2e/`)
- **Purpose**: Test complete user workflows
- **Speed**: Slow (seconds to minutes)
- **Dependencies**: Real (requires running server)
- **Example**: Register → Login → Create Project → Export

## 🛠️ Writing Tests

### Test File Naming
- Unit: `*.test.js` or `*.test.tsx`
- Integration: `*.integration.test.js`
- E2E: `*.e2e.test.js`

### Example Unit Test
```javascript
// scripts/tests/unit/server/auth.test.js
const { validateToken } = require('../../../server/middleware/auth');

describe('Auth Middleware', () => {
  it('should validate correct token', () => {
    const token = 'valid-token';
    const result = validateToken(token);
    expect(result).toBe(true);
  });
});
```

### Example Integration Test
```javascript
// scripts/tests/integration/projects.integration.test.js
const request = require('supertest');
const app = require('../../../server/server');

describe('Projects API', () => {
  it('should create new project', async () => {
    const response = await request(app)
      .post('/api/projects')
      .send({ name: 'Test Project' })
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
  });
});
```

## 📊 Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: All API routes covered
- **E2E Tests**: Critical user workflows covered

## 🔍 Debugging Tests

### Run Single Test File
```bash
npm test -- path/to/test.js
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with Verbose Output
```bash
npm test -- --verbose
```

## 🎯 Best Practices

1. **Keep tests isolated** - Each test should be independent
2. **Use descriptive names** - `it('should return 401 when token is missing')`
3. **Follow AAA pattern** - Arrange, Act, Assert
4. **Mock external dependencies** - APIs, databases, file system
5. **Clean up after tests** - Use `afterEach()` hooks

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Supertest](https://github.com/visionmedia/supertest)

---

**Note**: Make sure MongoDB is running before executing integration/e2e tests.
