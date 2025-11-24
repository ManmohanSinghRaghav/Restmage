/**
 * Simple manual test for floor plan and cost estimate endpoints
 * Replace TOKEN and IDS with your actual values
 */

const axios = require('axios');

const API = 'http://localhost:5000/api';

// Run this step by step:

async function step1_login() {
  console.log('\n1️⃣ LOGIN');
  const res = await axios.post(`${API}/auth/login`, {
    email: 'test@example.com',
    password: 'password123'
  });
  console.log('Token:', res.data.token.substring(0, 50) + '...');
  return res.data.token;
}

async function step2_createProject(token) {
  console.log('\n2️⃣ CREATE PROJECT');
  const res = await axios.post(`${API}/projects`, {
    name: 'Backend Test Project',
    propertyDetails: {
      type: 'residential',
      dimensions: { length: 50, width: 40, height: 12, unit: 'feet' }
    }
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Project ID:', res.data.project._id);
  console.log('Owner:', res.data.project.owner._id);
  return res.data.project._id;
}

async function step3_generateFloorPlan(token, projectId) {
  console.log('\n3️⃣ GENERATE FLOOR PLAN');
  const res = await axios.post(`${API}/floorplans/generate-ai`, {
    projectId,
    name: 'Test Floor Plan',
    inputs: {
      plot_width_ft: 40,
      plot_length_ft: 50,
      rooms: '2 bedrooms, 1 kitchen',
      floors: 1
    }
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Floor Plan ID:', res.data.data._id);
  console.log('Rooms:', res.data.data.rooms.length);
  return res.data.data._id;
}

async function step4_calculateCost(token, projectId, floorPlanId) {
  console.log('\n4️⃣ CALCULATE COST');
  const res = await axios.post(`${API}/cost-estimates/calculate`, {
    projectId,
    floorPlanId,
    name: 'Test Cost Estimate'
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Cost Estimate ID:', res.data.data._id);
  console.log('Total:', `₹${res.data.data.total.toLocaleString('en-IN')}`);
  return res.data.data._id;
}

async function step5_getProject(token, projectId) {
  console.log('\n5️⃣ GET PROJECT WITH REFERENCES');
  const res = await axios.get(`${API}/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Active Floor Plan:', res.data.activeFloorPlan ? 'YES ✅' : 'NO ❌');
  console.log('Active Cost Estimate:', res.data.activeCostEstimate ? 'YES ✅' : 'NO ❌');
  if (res.data.activeCostEstimate) {
    console.log('  Total Cost:', `₹${res.data.activeCostEstimate.total.toLocaleString('en-IN')}`);
  }
}

async function runTest() {
  try {
    const token = await step1_login();
    const projectId = await step2_createProject(token);
    const floorPlanId = await step3_generateFloorPlan(token, projectId);
    const costId = await step4_calculateCost(token, projectId, floorPlanId);
    await step5_getProject(token, projectId);
    
    console.log('\n✅ ALL TESTS PASSED!');
    console.log(`\n📋 IDs for cleanup:\nProject: ${projectId}\nFloor Plan: ${floorPlanId}\nCost: ${costId}`);
  } catch (error) {
    console.error('\n❌ TEST FAILED');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

runTest();
