
const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
let authToken = '';

// Mock user for registration/login
const testUser = {
  username: 'testuser_ai',
  email: 'test_ai@example.com',
  password: 'password123'
};

async function loginOrRegister() {
  try {
    console.log('Attempting to login...');
    const res = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    authToken = res.data.token;
    console.log('✅ Login successful');
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 400)) {
      console.log('Login failed, attempting to register...');
      try {
        const res = await axios.post(`${API_URL}/auth/register`, testUser);
        authToken = res.data.token;
        console.log('✅ Registration successful');
      } catch (regError) {
        console.error('❌ Registration failed:', regError.message);
        process.exit(1);
      }
    } else {
      console.error('❌ Login error:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      process.exit(1);
    }
  }
}

async function testChatbot() {
  console.log('\n🤖 Testing Chatbot API...');
  try {
    const res = await axios.post(
      `${API_URL}/chatbot/message`,
      { message: 'I need a floor plan for a 3 bedroom house' },
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );
    
    if (res.data.success) {
      console.log('✅ Chatbot response received');
      console.log('Source:', res.data.source);
      console.log('Response:', res.data.botResponse.substring(0, 100) + '...');
    } else {
      console.error('❌ Chatbot failed:', res.data.message);
    }
  } catch (error) {
    console.error('❌ Chatbot request failed:', error.message);
  }
}

async function testFloorPlanAI() {
  console.log('\n🏠 Testing AI Floor Plan Generation...');
  try {
    const inputs = {
      plot_width_ft: 40,
      plot_length_ft: 60,
      rooms: '2 Bedrooms, 1 Kitchen, 1 Living Room',
      location: 'Urban'
    };

    const res = await axios.post(
      `${API_URL}/floorplan/generate-ai`,
      inputs,
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );

    if (res.data.success) {
      console.log('✅ AI Floor Plan generated successfully');
      console.log('Rooms:', res.data.floorPlan.rooms.length);
    } else {
      console.error('❌ AI Floor Plan generation failed:', res.data.message);
    }
  } catch (error) {
    console.error('❌ AI Floor Plan request failed:', error.message);
    if (error.response) {
        console.error('Response data:', error.response.data);
    }
  }
}

async function run() {
  await loginOrRegister();
  await testChatbot();
  await testFloorPlanAI();
}

run();
