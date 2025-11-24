/**
 * Test project creation with exact frontend format
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testFrontendFormatProjectCreation() {
  console.log('🧪 Testing project creation with frontend format...\n');

  try {
    // Step 1: Login to get token
    console.log('1️⃣ Logging in...');
    const loginData = {
      email: 'testuser@example.com',
      password: 'Test@123456'
    };

    let authToken;
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
      authToken = loginResponse.data.token;
      console.log('✅ Login successful');
      console.log('Token:', authToken.substring(0, 20) + '...\n');
    } catch (error) {
      console.log('⚠️ Login failed, trying to register...');
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
        username: 'testuser',
        ...loginData
      });
      authToken = registerResponse.data.token;
      console.log('✅ Registration successful\n');
    }

    // Step 2: Create project with exact frontend format
    console.log('2️⃣ Creating project with frontend format...');
    const frontendProjectData = {
      name: 'Frontend Test Project',
      description: 'Testing with exact frontend format',
      propertyDetails: {
        type: 'residential',
        location: {
          address: '',
          city: '',
          state: '',
          zipCode: '',
          coordinates: { lat: 40.7128, lng: -74.0060 }
        },
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
          unit: 'feet'
        },
        materials: []
      },
      mapData: {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 13,
        bounds: [],
        layers: []
      },
      status: 'draft'
    };

    console.log('Project data being sent:');
    console.log(JSON.stringify(frontendProjectData, null, 2));

    const createResponse = await axios.post(
      `${BASE_URL}/projects`,
      frontendProjectData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ Project created successfully!');
    console.log('Project ID:', createResponse.data.project._id);
    console.log('Project Name:', createResponse.data.project.name);
    console.log('Status Code:', createResponse.status);
    console.log('\nFull response:');
    console.log(JSON.stringify(createResponse.data, null, 2));

    return createResponse.data.project._id;

  } catch (error) {
    console.error('❌ Test failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Run the test
testFrontendFormatProjectCreation()
  .then(() => {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed');
    process.exit(1);
  });
