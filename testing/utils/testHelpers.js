/**
 * Shared Test Helpers for Restmage Testing
 * Common utilities used across backend and frontend tests
 */

const axios = require('axios');

/**
 * Generate a random test user
 * @returns {Object} User credentials with random email
 */
function generateTestUser() {
  const randomId = Math.floor(Math.random() * 10000);
  return {
    username: `testuser${randomId}`,
    email: `testuser${randomId}@test.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User'
  };
}

/**
 * Register a new test user
 * @param {string} baseURL - API base URL (default: http://localhost:5000/api)
 * @param {Object} userData - Optional user data override
 * @returns {Promise<Object>} Registered user data and token
 */
async function registerTestUser(baseURL = 'http://localhost:5000/api', userData = null) {
  const user = userData || generateTestUser();
  
  try {
    const response = await axios.post(`${baseURL}/auth/register`, user);
    return {
      user: response.data.user,
      token: response.data.token,
      credentials: user
    };
  } catch (error) {
    throw new Error(`Failed to register test user: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Login with existing user
 * @param {string} baseURL - API base URL
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data and token
 */
async function loginTestUser(baseURL = 'http://localhost:5000/api', email, password) {
  try {
    const response = await axios.post(`${baseURL}/auth/login`, { email, password });
    return {
      user: response.data.user,
      token: response.data.token
    };
  } catch (error) {
    throw new Error(`Failed to login test user: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Create axios instance with authorization token
 * @param {string} token - JWT token
 * @param {string} baseURL - API base URL
 * @returns {Object} Configured axios instance
 */
function createAuthenticatedClient(token, baseURL = 'http://localhost:5000/api') {
  return axios.create({
    baseURL,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * Wait for specified milliseconds
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format test result for console output
 * @param {string} testName - Name of the test
 * @param {boolean} passed - Whether test passed
 * @param {string} details - Optional details
 * @returns {string} Formatted test result
 */
function formatTestResult(testName, passed, details = '') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const color = passed ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';
  return `${color}${status}${reset} ${testName}${details ? ` - ${details}` : ''}`;
}

/**
 * Print test section header
 * @param {string} sectionName - Name of test section
 */
function printTestSection(sectionName) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${sectionName}`);
  console.log('='.repeat(60));
}

/**
 * Validate required environment variables
 * @param {Array<string>} requiredVars - Array of required env variable names
 * @throws {Error} If any required variable is missing
 */
function validateEnvVariables(requiredVars) {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Check if server is running
 * @param {string} baseURL - API base URL
 * @returns {Promise<boolean>} True if server is reachable
 */
async function checkServerHealth(baseURL = 'http://localhost:5000') {
  try {
    const response = await axios.get(`${baseURL}/health`, { timeout: 3000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

module.exports = {
  generateTestUser,
  registerTestUser,
  loginTestUser,
  createAuthenticatedClient,
  sleep,
  formatTestResult,
  printTestSection,
  validateEnvVariables,
  checkServerHealth
};
