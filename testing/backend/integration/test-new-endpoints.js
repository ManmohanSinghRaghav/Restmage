/**
 * Test script for new 3-dataset architecture endpoints
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
let authToken = '';
let testProjectId = '';
let testFloorPlanId = '';
let testCostEstimateId = '';

// Test user credentials (make sure this user exists in your DB)
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123',
  username: 'testuser'
};

async function testEndpoint(name, method, url, data = null, headers = {}) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   ${method} ${url}`);
  
  try {
    const config = {
      method,
      url: `${API_BASE}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2).substring(0, 500));
    return response.data;
  } catch (error) {
    if (error.response) {
      console.log(`   ❌ Error: ${error.response.status}`);
      console.log(`   Message:`, error.response.data);
    } else {
      console.log(`   ❌ Error:`, error.message);
    }
    throw error;
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests for 3-Dataset Architecture\n');
  console.log('=' .repeat(60));

  try {
    // 1. Register or Login
    console.log('\n📝 Step 1: Authentication');
    try {
      const registerData = await testEndpoint(
        'Register User',
        'POST',
        '/auth/register',
        TEST_USER
      );
    } catch (error) {
      console.log('   (User might already exist, trying login...)');
    }

    const loginData = await testEndpoint(
      'Login User',
      'POST',
      '/auth/login',
      { email: TEST_USER.email, password: TEST_USER.password }
    );
    
    authToken = loginData.token;
    console.log(`   🔑 Auth Token: ${authToken.substring(0, 20)}...`);

    // 2. Create a test project
    console.log('\n📝 Step 2: Create Test Project');
    const projectData = await testEndpoint(
      'Create Project',
      'POST',
      '/projects',
      {
        name: 'Test Project - 3 Dataset Architecture',
        description: 'Testing new floor plan and cost estimate system',
        propertyDetails: {
          type: 'residential',
          dimensions: {
            length: 50,
            width: 40,
            height: 12,
            unit: 'feet'
          },
          materials: [
            {
              type: 'concrete',
              quantity: 100,
              unit: 'cubic_meter',
              pricePerUnit: 5500
            }
          ]
        }
      },
      { Authorization: `Bearer ${authToken}` }
    );
    
    testProjectId = projectData.project._id;
    console.log(`   🏗️  Project ID: ${testProjectId}`);

    // 3. Test Floor Plan Generation
    console.log('\n📝 Step 3: Generate AI Floor Plan');
    const floorPlanData = await testEndpoint(
      'Generate AI Floor Plan',
      'POST',
      '/floorplans/generate-ai',
      {
        projectId: testProjectId,
        name: 'Test 2BHK Floor Plan',
        inputs: {
          plot_width_ft: 40,
          plot_length_ft: 50,
          entrance_facing: 'north',
          setback_front_ft: 5,
          setback_rear_ft: 5,
          setback_side_left_ft: 3,
          setback_side_right_ft: 3,
          rooms: '2 bedrooms, 1 bathroom, 1 kitchen, 1 living room',
          floors: 1,
          location: 'Mumbai, India',
          vastu_compliance: true
        }
      },
      { Authorization: `Bearer ${authToken}` }
    );
    
    testFloorPlanId = floorPlanData.data._id;
    console.log(`   🏠 Floor Plan ID: ${testFloorPlanId}`);

    // 4. Get Floor Plan by ID
    console.log('\n📝 Step 4: Get Floor Plan Details');
    await testEndpoint(
      'Get Floor Plan',
      'GET',
      `/floorplans/${testFloorPlanId}`,
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    // 5. List Floor Plans
    console.log('\n📝 Step 5: List All Floor Plans');
    await testEndpoint(
      'List Floor Plans',
      'GET',
      '/floorplans',
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    // 6. Calculate Cost Estimate
    console.log('\n📝 Step 6: Calculate Cost Estimate');
    const costData = await testEndpoint(
      'Calculate Cost Estimate',
      'POST',
      '/cost-estimates/calculate',
      {
        projectId: testProjectId,
        floorPlanId: testFloorPlanId,
        name: 'Initial Cost Estimate'
      },
      { Authorization: `Bearer ${authToken}` }
    );
    
    testCostEstimateId = costData.data._id;
    console.log(`   💰 Cost Estimate ID: ${testCostEstimateId}`);
    console.log(`   💰 Total Cost: ₹${costData.data.total.toLocaleString('en-IN')}`);

    // 7. Get Cost Estimate by ID
    console.log('\n📝 Step 7: Get Cost Estimate Details');
    await testEndpoint(
      'Get Cost Estimate',
      'GET',
      `/cost-estimates/${testCostEstimateId}`,
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    // 8. Update Cost Estimate (Fine-tuning)
    console.log('\n📝 Step 8: Update Cost Estimate');
    await testEndpoint(
      'Update Cost Estimate',
      'PUT',
      `/cost-estimates/${testCostEstimateId}`,
      {
        materials: 500000,
        labor: 300000,
        permits: 50000,
        equipment: 100000
      },
      { Authorization: `Bearer ${authToken}` }
    );

    // 9. Get Project with populated references
    console.log('\n📝 Step 9: Get Project with References');
    const projectWithRefs = await testEndpoint(
      'Get Project',
      'GET',
      `/projects/${testProjectId}`,
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    console.log(`   ✅ Active Floor Plan: ${projectWithRefs.activeFloorPlan ? 'Populated' : 'Not set'}`);
    console.log(`   ✅ Active Cost Estimate: ${projectWithRefs.activeCostEstimate ? 'Populated' : 'Not set'}`);

    // 10. List Cost Estimates
    console.log('\n📝 Step 10: List All Cost Estimates');
    await testEndpoint(
      'List Cost Estimates',
      'GET',
      '/cost-estimates',
      null,
      { Authorization: `Bearer ${authToken}` }
    );

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed successfully!');
    console.log('\nTest Resources Created:');
    console.log(`   Project ID: ${testProjectId}`);
    console.log(`   Floor Plan ID: ${testFloorPlanId}`);
    console.log(`   Cost Estimate ID: ${testCostEstimateId}`);
    console.log('\n💡 You can clean up by deleting the project in the UI');

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Tests failed!');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests().then(() => {
  console.log('\n🎉 Test suite completed!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
