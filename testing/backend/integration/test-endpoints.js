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

async function testEndpoint(method, url, data = null, headers = {}) {
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
    console.log(`\n✅ ${method} ${url} - Status: ${response.status}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.log(`\n❌ ${method} ${url} - Status: ${error.response?.status || 'ERROR'}`);
    if (error.response?.data) {
      console.log('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting API Endpoint Tests...\n');
  console.log('=' .repeat(80));

  // 1. Health Check
  console.log('\n📍 TEST 1: Health Check');
  await testEndpoint('GET', '/health');

  // 2. Register User
  console.log('\n📍 TEST 2: Register New User');
  const registerData = await testEndpoint('POST', '/auth/register', testUser);

  // 3. Login
  console.log('\n📍 TEST 3: User Login');
  const loginData = await testEndpoint('POST', '/auth/login', {
    email: testUser.email,
    password: testUser.password
  });
  if (loginData && loginData.token) {
    authToken = loginData.token;
  }

  // 4. Get Current User (Protected)
  console.log('\n📍 TEST 4: Get Current User Info');
  if (authToken) {
    await testEndpoint('GET', '/auth/me', null, { Authorization: `Bearer ${authToken}` });
  }

  // 5. Create Project (Protected)
  console.log('\n📍 TEST 5: Create New Project');
  if (authToken) {
    const projectData = await testEndpoint('POST', '/projects', {
      name: 'Luxury Residential Complex',
      description: 'A modern 5-story residential building with 20 units, featuring sustainable design and smart home technology',
      location: 'Downtown Seattle, WA',
      propertyDetails: {
        type: 'residential',
        dimensions: {
          length: 80,
          width: 60,
          height: 25
        }
      },
      status: 'planning',
      budget: 5000000
    }, { Authorization: `Bearer ${authToken}` });

    if (projectData && projectData.project && projectData.project._id) {
      testProjectId = projectData.project._id;
    }
  }

  // 6. Get All Projects (Protected)
  console.log('\n📍 TEST 6: Get All Projects');
  if (authToken) {
    await testEndpoint('GET', '/projects', null, { Authorization: `Bearer ${authToken}` });
  }

  // 7. Get Specific Project (Protected)
  console.log('\n📍 TEST 7: Get Specific Project Details');
  if (authToken && testProjectId) {
    await testEndpoint('GET', `/projects/${testProjectId}`, null, { Authorization: `Bearer ${authToken}` });
  }

  // 8. Update Project (Protected)
  console.log('\n📍 TEST 8: Update Project');
  if (authToken && testProjectId) {
    await testEndpoint('PUT', `/projects/${testProjectId}`, {
      name: 'Luxury Residential Complex - Updated',
      description: 'Updated: A modern 5-story residential building with 25 units, enhanced amenities',
      status: 'in-progress',
      budget: 5500000
    }, { Authorization: `Bearer ${authToken}` });
  }

  // 9. Test Map Endpoints (Protected)
  console.log('\n📍 TEST 9: Get Project Map Data');
  if (authToken && testProjectId) {
    await testEndpoint('GET', `/maps/${testProjectId}`, null, { Authorization: `Bearer ${authToken}` });
  }
  
  console.log('\n📍 TEST 10: Add Map Layer');
  if (authToken && testProjectId) {
    await testEndpoint('POST', `/maps/${testProjectId}/layers`, { 
      name: 'Building Footprint',
      type: 'polygon',
      coordinates: [
        { lat: 47.6062, lng: -122.3321 },
        { lat: 47.6062, lng: -122.3310 },
        { lat: 47.6055, lng: -122.3310 },
        { lat: 47.6055, lng: -122.3321 }
      ],
      properties: {
        color: '#3498db',
        opacity: 0.7
      }
    }, { Authorization: `Bearer ${authToken}` });
  }

  // 10. Test Floorplan Endpoints (Protected)
  console.log('\n📍 TEST 11: Generate Floor Plan');
  if (authToken) {
    await testEndpoint('POST', '/floorplan/generate', { 
      propertyWidth: 80,
      propertyHeight: 60,
      rooms: [
        { type: 'bedroom', count: 3 },
        { type: 'bathroom', count: 2 },
        { type: 'living room', count: 1 },
        { type: 'kitchen', count: 1 },
        { type: 'dining room', count: 1 },
        { type: 'balcony', count: 2 }
      ]
    }, { Authorization: `Bearer ${authToken}` });
  }
  
  console.log('\n📍 TEST 12: Get Available Room Types');
  if (authToken) {
    await testEndpoint('GET', '/floorplan/room-types', null, { Authorization: `Bearer ${authToken}` });
  }

  // 11. Test Cost Estimation (Protected)
  console.log('\n📍 TEST 13: Calculate Project Cost');
  if (authToken && testProjectId) {
    await testEndpoint('POST', `/cost/${testProjectId}/calculate`, {
      materials: [
        { name: 'concrete', quantity: 500, unit: 'cubic_yard' },
        { name: 'steel', quantity: 25000, unit: 'pound' },
        { name: 'brick', quantity: 50000, unit: 'piece' },
        { name: 'windows', quantity: 80, unit: 'piece' },
        { name: 'doors', quantity: 60, unit: 'piece' }
      ],
      labor: [
        { trade: 'general', hours: 2000 },
        { trade: 'electrical', hours: 500 },
        { trade: 'plumbing', hours: 400 }
      ]
    }, { Authorization: `Bearer ${authToken}` });
  }
  
  console.log('\n📍 TEST 14: Get Cost History');
  if (authToken && testProjectId) {
    await testEndpoint('GET', `/cost/${testProjectId}`, null, { Authorization: `Bearer ${authToken}` });
  }

  // 12. Test Price Prediction (Protected)
  console.log('\n📍 TEST 15: Predict Property Price');
  if (authToken) {
    await testEndpoint('POST', '/price-prediction/predict', {
      area: 2500,
      bedrooms: 3,
      bathrooms: 2,
      location: 'urban',
      condition: 'excellent',
      age: 2,
      amenities: {
        garage: true,
        pool: true,
        garden: true
      }
    }, { Authorization: `Bearer ${authToken}` });
  }

  // 13. Test Chatbot (Protected)
  console.log('\n📍 TEST 16: Chatbot Interaction');
  if (authToken) {
    await testEndpoint('POST', '/chatbot/message', {
      message: 'What are the best materials for building a sustainable residential complex?',
      context: {
        projectType: 'residential',
        budget: 5000000
      }
    }, { Authorization: `Bearer ${authToken}` });
  }

  // 14. Test Export (Protected)
  console.log('\n📍 TEST 17: Export Project as JSON');
  if (authToken && testProjectId) {
    await testEndpoint('GET', `/export/${testProjectId}/json`, null, { Authorization: `Bearer ${authToken}` });
  }
  
  console.log('\n📍 TEST 18: Export Project as CSV');
  if (authToken && testProjectId) {
    await testEndpoint('GET', `/export/${testProjectId}/csv`, null, { Authorization: `Bearer ${authToken}` });
  }

  // 15. Cleanup - Delete Test Project (Protected)
  console.log('\n📍 TEST 19: Delete Test Project');
  if (authToken && testProjectId) {
    await testEndpoint('DELETE', `/projects/${testProjectId}`, null, { Authorization: `Bearer ${authToken}` });
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n🎉 API Endpoint Testing Complete!');
  console.log('\n' + '='.repeat(80));
}

// Run the tests
runTests().catch(console.error);