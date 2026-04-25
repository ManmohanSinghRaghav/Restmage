/**
 * Environment Variable Validator for Tests
 * Ensures all required environment variables are present before running tests
 */

const fs = require('fs');
const path = require('path');

/**
 * Required environment variables for backend tests
 */
const REQUIRED_BACKEND_VARS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'GEMINI_API_KEY'
];

/**
 * Optional environment variables (with defaults)
 */
const OPTIONAL_VARS = {
  PORT: '5000',
  NODE_ENV: 'development',
  JWT_EXPIRE: '30d'
};

/**
 * Validate environment variables for backend tests
 * @param {boolean} verbose - Whether to print detailed output
 * @returns {Object} Validation result { valid: boolean, missing: Array, warnings: Array }
 */
function validateBackendEnv(verbose = true) {
  const missing = [];
  const warnings = [];
  
  // Check required variables
  for (const varName of REQUIRED_BACKEND_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  // Check optional variables
  for (const [varName, defaultValue] of Object.entries(OPTIONAL_VARS)) {
    if (!process.env[varName]) {
      warnings.push(`${varName} not set, using default: ${defaultValue}`);
    }
  }
  
  const valid = missing.length === 0;
  
  if (verbose) {
    if (valid) {
      console.log('✓ All required environment variables are set');
    } else {
      console.error('✗ Missing required environment variables:');
      missing.forEach(varName => console.error(`  - ${varName}`));
    }
    
    if (warnings.length > 0) {
      console.warn('\n⚠️  Optional variables not set:');
      warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
  }
  
  return { valid, missing, warnings };
}

/**
 * Check if .env file exists in server directory
 * @returns {boolean} True if .env exists
 */
function checkEnvFileExists() {
  const serverEnvPath = path.join(__dirname, '../../server/.env');
  return fs.existsSync(serverEnvPath);
}

/**
 * Load environment variables from server/.env file
 * @returns {boolean} True if successfully loaded
 */
function loadEnvFile() {
  try {
    const serverEnvPath = path.join(__dirname, '../../server/.env');
    
    if (!fs.existsSync(serverEnvPath)) {
      console.error('✗ .env file not found at:', serverEnvPath);
      return false;
    }
    
    // Read and parse .env file
    const envContent = fs.readFileSync(serverEnvPath, 'utf-8');
    const envLines = envContent.split('\n');
    
    envLines.forEach(line => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) {
        return;
      }
      
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // Don't override existing env vars
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value;
        }
      }
    });
    
    console.log('✓ Environment variables loaded from .env file');
    return true;
  } catch (error) {
    console.error('✗ Error loading .env file:', error.message);
    return false;
  }
}

/**
 * Get environment summary for debugging
 * @returns {Object} Environment summary (with sensitive data masked)
 */
function getEnvSummary() {
  const summary = {};
  
  const allVars = [...REQUIRED_BACKEND_VARS, ...Object.keys(OPTIONAL_VARS)];
  
  for (const varName of allVars) {
    const value = process.env[varName];
    if (value) {
      // Mask sensitive values
      if (varName.includes('KEY') || varName.includes('SECRET') || varName.includes('PASSWORD')) {
        summary[varName] = '***' + value.slice(-4);
      } else if (varName === 'MONGODB_URI') {
        // Mask MongoDB password
        summary[varName] = value.replace(/:[^:]*@/, ':***@');
      } else {
        summary[varName] = value;
      }
    } else {
      summary[varName] = '<not set>';
    }
  }
  
  return summary;
}

/**
 * Print environment summary
 */
function printEnvSummary() {
  console.log('\n📋 Environment Variables Summary:');
  console.log('─'.repeat(60));
  
  const summary = getEnvSummary();
  for (const [key, value] of Object.entries(summary)) {
    const status = value === '<not set>' ? '✗' : '✓';
    console.log(`  ${status} ${key}: ${value}`);
  }
  
  console.log('─'.repeat(60));
}

/**
 * Validate and load environment for tests
 * Exits process if validation fails
 * @param {boolean} verbose - Whether to print detailed output
 */
function validateAndLoad(verbose = true) {
  if (verbose) {
    console.log('🔍 Validating test environment...\n');
  }
  
  // Load .env file if it exists
  if (checkEnvFileExists()) {
    loadEnvFile();
  } else {
    console.warn('⚠️  .env file not found. Make sure environment variables are set.');
  }
  
  // Validate required variables
  const validation = validateBackendEnv(verbose);
  
  if (verbose) {
    printEnvSummary();
  }
  
  if (!validation.valid) {
    console.error('\n❌ Environment validation failed. Cannot run tests.');
    console.error('\nTo fix this:');
    console.error('1. Create a .env file in the server/ directory');
    console.error('2. Copy from .env.example if available');
    console.error('3. Set all required environment variables\n');
    process.exit(1);
  }
  
  if (verbose) {
    console.log('\n✅ Environment validation passed\n');
  }
}

module.exports = {
  validateBackendEnv,
  checkEnvFileExists,
  loadEnvFile,
  getEnvSummary,
  printEnvSummary,
  validateAndLoad,
  REQUIRED_BACKEND_VARS,
  OPTIONAL_VARS
};
