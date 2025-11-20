require('dotenv').config();
const axios = require('axios');

async function testOpenAIDirectly() {
  console.log('\n🧪 Testing OpenAI API directly\n');
  console.log('API Key:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 20)}...` : 'NOT FOUND');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('\n❌ OPENAI_API_KEY not found in environment variables!');
    console.log('\nMake sure your .env file contains:');
    console.log('OPENAI_API_KEY=your-actual-key-here');
    return;
  }

  try {
    console.log('\nSending test request to OpenAI...\n');
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful real estate assistant.'
          },
          {
            role: 'user',
            content: 'What are the best materials for sustainable construction?'
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ OpenAI API Response:\n');
    console.log(response.data.choices[0].message.content);
    console.log('\n✅ OpenAI API is working correctly!');
    
  } catch (error) {
    console.error('\n❌ OpenAI API Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

testOpenAIDirectly();
