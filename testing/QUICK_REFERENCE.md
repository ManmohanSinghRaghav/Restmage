# Quick Test Reference

## 🚀 Common Test Commands

### From Root Directory (Recommended)

```bash
# Run all tests
npm test

# Backend tests
npm run test:backend              # Run Jest tests (when available)
npm run test:backend:manual       # Run integration test suite with summary
npm run test:backend:integration  # Run comprehensive integration tests
npm run test:backend:unit         # Run unit tests

# Frontend tests
npm run test:frontend             # Run React component tests
```

### From Testing Directory

```bash
cd testing

# Backend integration tests
npm run test:backend:integration              # Summary test suite
npm run test:backend:integration:full         # Comprehensive tests
npm run test:backend:integration:simple       # Simple workflow test
npm run test:backend:integration:endpoints    # Endpoint tests (verbose)
npm run test:backend:integration:chatbot      # Chatbot tests
npm run test:backend:integration:mongodb      # MongoDB storage tests
npm run test:backend:integration:frontend-format  # Frontend format tests

# Backend unit tests
npm run test:backend:unit                     # Gemini service unit tests

# Debug scripts
npm run test:backend:debug                    # Authorization debug script

# External API tests
npm run test:backend:external                 # OpenAI API direct test
```

### Individual Test Files

```bash
# Integration tests
node testing/backend/integration/test-summary.js
node testing/backend/integration/test-new-endpoints.js
node testing/backend/integration/test-simple.js
node testing/backend/integration/test-endpoints.js
node testing/backend/integration/test-chatbot.js
node testing/backend/integration/test-mongodb-storage.js
node testing/backend/integration/test-frontend-format.js

# Unit tests
node testing/backend/unit/test-refactored-code.js

# Debug
node testing/backend/debug/debug-auth.js

# External
node testing/backend/external/test-openai-direct.js
```

## 📋 Prerequisites Checklist

Before running tests:

- [ ] MongoDB is running (local or cloud)
- [ ] Server is running on `http://localhost:5000`
- [ ] Environment variables set in `server/.env`:
  - [ ] `MONGODB_URI`
  - [ ] `JWT_SECRET`
  - [ ] `GEMINI_API_KEY`
  - [ ] `OPENAI_API_KEY` (only for external tests)

## 🧪 Test Categories

| Category | Location | Purpose | Requires Server |
|----------|----------|---------|----------------|
| **Integration** | `backend/integration/` | API endpoint testing | ✅ Yes |
| **Unit** | `backend/unit/` | Service/utility testing | ❌ No |
| **Debug** | `backend/debug/` | Debug scripts | ❌ No (direct DB) |
| **External** | `backend/external/` | External API testing | ❌ No |
| **Frontend** | `frontend/` | React component tests | ❌ No |

## 🎯 Recommended Test Order

1. **Quick Check**: `npm run test:backend:manual`
2. **Comprehensive**: `npm run test:backend:integration`
3. **Unit Tests**: `npm run test:backend:unit`
4. **Frontend**: `npm run test:frontend`

## 📊 Test Output

### Successful Test
```
✓ PASS Test name - Details
```

### Failed Test
```
✗ FAIL Test name - Error details
```

### Test Summary (test-summary.js)
```
==========================================================
  TEST SUMMARY
==========================================================
✓ Passed: 18
✗ Failed: 1
─────────────────────────
Total: 19 tests
Success Rate: 94.74%
```

## 🔧 Troubleshooting

| Error | Solution |
|-------|----------|
| `ECONNREFUSED localhost:5000` | Start server: `npm run server` |
| `MongoDB connection failed` | Start MongoDB or check connection string |
| `Missing env variables` | Copy `server/.env.example` to `server/.env` |
| `GEMINI_API_KEY not set` | Add API key to `server/.env` |
| `Cannot find module` | Run `npm install` in root, server, and client |

## 📚 More Information

- Full testing guide: `testing/README.md`
- Frontend testing: `testing/frontend/README.md`
- Project setup: Root `README.md`

---

**Quick tip**: Most integration tests create random test users (testuser123@test.com) so you don't need to manually create accounts.
