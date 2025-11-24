/**
 * Pre-Test Setup Script
 * Validates environment and checks prerequisites before running tests
 * Run: node testing/utils/checkSetup.js
 */

const axios = require('axios');
const { validateBackendEnv, printEnvSummary, loadEnvFile } = require('./envValidator');

const SERVER_URL = 'http://localhost:5000';
const API_URL = `${SERVER_URL}/api`;

async function checkServerHealth() {
  try {
    const response = await axios.get(`${API_URL}/health`, { timeout: 3000 });
    return { running: true, status: response.status, data: response.data };
  } catch (error) {
    return { running: false, error: error.message };
  }
}

async function checkMongoDBConnection() {
  const mongoose = require('mongoose');
  
  if (!process.env.MONGODB_URI) {
    return { connected: false, error: 'MONGODB_URI not set' };
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, { 
      serverSelectionTimeoutMS: 5000 
    });
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    await mongoose.connection.close();
    
    return { 
      connected: true, 
      collections: collections.length,
      database: mongoose.connection.db.databaseName 
    };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

async function checkAPIEndpoints() {
  try {
    const endpoints = [
      { path: '/health', name: 'Health Check' },
      { path: '/auth/register', name: 'Auth - Register', method: 'POST' },
      { path: '/auth/login', name: 'Auth - Login', method: 'POST' }
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
      try {
        if (endpoint.method === 'POST') {
          // Just check if endpoint exists (will fail with validation error, but that's OK)
          await axios.post(`${API_URL}${endpoint.path}`, {}, { timeout: 2000 });
        } else {
          await axios.get(`${API_URL}${endpoint.path}`, { timeout: 2000 });
        }
        results.push({ ...endpoint, available: true });
      } catch (error) {
        // 400/422 means endpoint exists but has validation errors (that's OK)
        const available = error.response?.status === 400 || 
                         error.response?.status === 422 ||
                         error.response?.status === 200;
        results.push({ ...endpoint, available });
      }
    }
    
    return { checked: true, endpoints: results };
  } catch (error) {
    return { checked: false, error: error.message };
  }
}

async function runSetupCheck() {
  console.log('\n🔍 Restmage Testing Setup Check\n');
  console.log('='.repeat(60));
  
  // 1. Load environment
  console.log('\n1️⃣  Loading Environment Variables...');
  loadEnvFile();
  
  // 2. Validate environment
  console.log('\n2️⃣  Validating Environment...');
  const envValidation = validateBackendEnv(false);
  
  if (envValidation.valid) {
    console.log('✅ All required environment variables are set');
  } else {
    console.log('❌ Missing environment variables:');
    envValidation.missing.forEach(v => console.log(`   - ${v}`));
  }
  
  if (envValidation.warnings.length > 0) {
    console.log('\n⚠️  Optional variables not set:');
    envValidation.warnings.forEach(w => console.log(`   - ${w}`));
  }
  
  // 3. Check MongoDB
  console.log('\n3️⃣  Checking MongoDB Connection...');
  const mongoStatus = await checkMongoDBConnection();
  
  if (mongoStatus.connected) {
    console.log(`✅ MongoDB connected: ${mongoStatus.database}`);
    console.log(`   Collections: ${mongoStatus.collections}`);
  } else {
    console.log(`❌ MongoDB connection failed: ${mongoStatus.error}`);
  }
  
  // 4. Check Server
  console.log('\n4️⃣  Checking Server Status...');
  const serverStatus = await checkServerHealth();
  
  if (serverStatus.running) {
    console.log(`✅ Server is running at ${SERVER_URL}`);
    if (serverStatus.data) {
      console.log(`   Status: ${serverStatus.data.status || 'OK'}`);
    }
  } else {
    console.log(`❌ Server is not running: ${serverStatus.error}`);
    console.log(`   Expected at: ${SERVER_URL}`);
  }
  
  // 5. Check API Endpoints
  if (serverStatus.running) {
    console.log('\n5️⃣  Checking API Endpoints...');
    const apiStatus = await checkAPIEndpoints();
    
    if (apiStatus.checked) {
      apiStatus.endpoints.forEach(endpoint => {
        const status = endpoint.available ? '✅' : '❌';
        console.log(`   ${status} ${endpoint.name} (${endpoint.path})`);
      });
    }
  }
  
  // 6. Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Setup Summary:\n');
  
  const checks = [
    { name: 'Environment Variables', passed: envValidation.valid },
    { name: 'MongoDB Connection', passed: mongoStatus.connected },
    { name: 'Server Running', passed: serverStatus.running }
  ];
  
  checks.forEach(check => {
    const status = check.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${status} - ${check.name}`);
  });
  
  const allPassed = checks.every(c => c.passed);
  
  console.log('\n' + '='.repeat(60));
  
  if (allPassed) {
    console.log('\n✅ All checks passed! Ready to run tests.\n');
    console.log('Run tests with:');
    console.log('  npm test                      # All tests');
    console.log('  npm run test:backend:manual   # Backend integration tests');
    console.log('  npm run test:frontend         # Frontend tests\n');
    process.exit(0);
  } else {
    console.log('\n❌ Some checks failed. Please fix the issues above.\n');
    console.log('Common fixes:');
    if (!envValidation.valid) {
      console.log('  - Create server/.env file with required variables');
    }
    if (!mongoStatus.connected) {
      console.log('  - Start MongoDB or check MONGODB_URI');
    }
    if (!serverStatus.running) {
      console.log('  - Start server: npm run server');
    }
    console.log('');
    process.exit(1);
  }
}

// Run the setup check
runSetupCheck().catch(error => {
  console.error('\n❌ Setup check failed:', error.message);
  process.exit(1);
});
