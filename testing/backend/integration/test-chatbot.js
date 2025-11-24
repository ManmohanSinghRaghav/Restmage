const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

async function testChatbot() {
  console.log('\n🤖 Testing Chatbot with ChatGPT API\n');
  console.log('='.repeat(80));

  try {
    // 1. Login first to get auth token
    console.log('\n1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    authToken = loginResponse.data.token;
    console.log('✅ Logged in successfully');

    // 2. Test chatbot with various questions
    const questions = [
      'Hello! How can you help me?',
      'What are the best materials for sustainable construction?',
      'I need a floor plan for a 3 bedroom house',
      'What is the average price of a 2000 sq ft house in an urban area?',
      'Give me design tips for modern homes'
    ];

    for (let i = 0; i < questions.length; i++) {
      console.log(`\n${i + 2}. Testing: "${questions[i]}"`);
      
      const response = await axios.post(
        `${BASE_URL}/chatbot/message`,
        { message: questions[i] },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      console.log(`✅ Response Source: ${response.data.source || 'chatgpt'}`);
      console.log(`📝 Bot Response:\n${response.data.botResponse}\n`);
      console.log('-'.repeat(80));
    }

    console.log('\n✅ All chatbot tests completed successfully!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error(error.message);
    }
    
    // Try registering a new user if login fails
    if (error.response?.status === 400 || error.response?.status === 401) {
      console.log('\n⚠️  Login failed. You may need to register first.');
      console.log('Run the main test-summary.js to create a test user.');
    }
  }
}

testChatbot();
