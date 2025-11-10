/**
 * Mock Authentication Utilities
 * Helper functions for mocking JWT authentication in tests
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

/**
 * Create a mock user object
 */
const createMockUser = (overrides = {}) => {
  return {
    _id: 'test-user-id-123',
    username: 'testuser',
    email: 'test@example.com',
    role: 'user',
    ...overrides
  };
};

/**
 * Generate a valid JWT token for testing
 */
const generateTestToken = (userId = 'test-user-id-123', email = 'test@example.com') => {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

/**
 * Mock auth middleware that bypasses JWT verification
 */
const mockAuthMiddleware = (req, res, next) => {
  req.user = createMockUser();
  next();
};

/**
 * Create authorization header with test token
 */
const authHeader = () => {
  const token = generateTestToken();
  return { Authorization: `Bearer ${token}` };
};

module.exports = {
  createMockUser,
  generateTestToken,
  mockAuthMiddleware,
  authHeader,
  JWT_SECRET
};
