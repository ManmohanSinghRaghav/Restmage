const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const randomId = Math.floor(Math.random() * 10000);
const testUser = {
  username: `testuser${randomId}`,
  email: `test${randomId}@example.com`,
  password: 'testpassword123'
};

let authToken = '';
let testProjectId = '';
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

async function testEndpoint(name, method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.data = data;
    }

    const response = await axios(config);
    testResults.passed++;
    testResults.tests.push({
      name,
      status: 'PASS',
      code: response.status,
      responseSize: JSON.stringify(response.data).length
    });
    return response.data;
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({
      name,
      status: 'FAIL',
      code: error.response?.status || 'ERROR',
      error: error.response?.data?.message || error.message
    });
    return null;
  }
}

async function runTests() {
  console.log('\n🧪 Restmage API Test Suite\n');
  console.log('='.repeat(80));

  // Auth Tests
  await testEndpoint('Health Check', 'GET', '/health');
  const registerData = await testEndpoint('Register User', 'POST', '/auth/register', testUser);
  const loginData = await testEndpoint('Login User', 'POST', '/auth/login', {
    email: testUser.email,
    password: testUser.password
  });
  
  if (loginData && loginData.token) {
    authToken = loginData.token;
  }

  await testEndpoint('Get Current User', 'GET', '/auth/me', null, { Authorization: `Bearer ${authToken}` });

  // Project Tests
  const projectData = await testEndpoint('Create Project', 'POST', '/projects', {
    name: 'Luxury Residential Complex',
    description: 'Modern 5-story building',
    location: 'Downtown Seattle',
    propertyDetails: {
      type: 'residential',
      dimensions: { length: 80, width: 60, height: 25 }
    }
  }, { Authorization: `Bearer ${authToken}` });

  if (projectData && projectData.project) {
    testProjectId = projectData.project._id;
  }

  await testEndpoint('List Projects', 'GET', '/projects', null, { Authorization: `Bearer ${authToken}` });
  
  if (testProjectId) {
    await testEndpoint('Get Project', 'GET', `/projects/${testProjectId}`, null, { Authorization: `Bearer ${authToken}` });
    await testEndpoint('Update Project', 'PUT', `/projects/${testProjectId}`, {
      name: 'Updated Project',
      status: 'in-progress'
    }, { Authorization: `Bearer ${authToken}` });
  }

  // Map Tests
  if (testProjectId) {
    await testEndpoint('Get Map Data', 'GET', `/maps/${testProjectId}`, null, { Authorization: `Bearer ${authToken}` });
    await testEndpoint('Add Map Layer', 'POST', `/maps/${testProjectId}/layers`, {
      name: 'Building Footprint',
      type: 'polygon',
      coordinates: [
        { lat: 47.6062, lng: -122.3321 },
        { lat: 47.6062, lng: -122.3310 }
      ]
    }, { Authorization: `Bearer ${authToken}` });
  }

  // Floorplan Tests
  await testEndpoint('Generate Floorplan', 'POST', '/floorplan/generate', {
    propertyWidth: 80,
    propertyHeight: 60,
    rooms: [
      { type: 'bedroom', count: 3 },
      { type: 'bathroom', count: 2 },
      { type: 'living room', count: 1 },
      { type: 'kitchen', count: 1 }
    ]
  }, { Authorization: `Bearer ${authToken}` });

  await testEndpoint('Get Room Types', 'GET', '/floorplan/room-types', null, { Authorization: `Bearer ${authToken}` });

  // Cost Tests
  if (testProjectId) {
    await testEndpoint('Calculate Cost', 'POST', `/cost/${testProjectId}/calculate`, {
      materials: [
        { name: 'concrete', quantity: 500, unit: 'cubic_yard' },
        { name: 'steel', quantity: 25000, unit: 'pound' }
      ],
      labor: [
        { trade: 'general', hours: 2000 }
      ]
    }, { Authorization: `Bearer ${authToken}` });

    await testEndpoint('Get Cost History', 'GET', `/cost/${testProjectId}`, null, { Authorization: `Bearer ${authToken}` });
  }

  // Price Prediction Test
  await testEndpoint('Predict Price', 'POST', '/price-prediction/predict', {
    area: 2500,
    bedrooms: 3,
    bathrooms: 2,
    location: 'urban',
    condition: 'excellent',
    age: 2
  }, { Authorization: `Bearer ${authToken}` });

  // Chatbot Test
  await testEndpoint('Chatbot Message', 'POST', '/chatbot/message', {
    message: 'What are the best materials for sustainable construction?'
  }, { Authorization: `Bearer ${authToken}` });

  // Export Tests
  if (testProjectId) {
    await testEndpoint('Export JSON', 'GET', `/export/${testProjectId}/json`, null, { Authorization: `Bearer ${authToken}` });
    await testEndpoint('Export CSV', 'GET', `/export/${testProjectId}/csv`, null, { Authorization: `Bearer ${authToken}` });
  }

  // Cleanup
  if (testProjectId) {
    await testEndpoint('Delete Project', 'DELETE', `/projects/${testProjectId}`, null, { Authorization: `Bearer ${authToken}` });
  }

  // Print Results
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Test Results Summary\n');
  
  testResults.tests.forEach((test, index) => {
    const icon = test.status === 'PASS' ? '✅' : '❌';
    const details = test.status === 'PASS' 
      ? `(${test.code}) - ${test.responseSize} bytes`
      : `(${test.code}) - ${test.error}`;
    console.log(`${icon} ${(index + 1).toString().padStart(2)}) ${test.name.padEnd(25)} ${details}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log(`\n✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`);
  console.log('\n' + '='.repeat(80));
}

runTests().catch(console.error);
