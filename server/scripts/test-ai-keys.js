require('dotenv').config();
const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testOpenAI() {
  console.log('Testing OpenAI API Key...');
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY is missing in .env');
    return;
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: "Hello, are you working?" }],
      model: "gpt-3.5-turbo",
      max_tokens: 10
    });
    console.log('✅ OpenAI API is working!');
    console.log('Response:', completion.choices[0].message.content);
  } catch (error) {
    console.error('❌ OpenAI API Failed:', error.message);
  }
}

async function testGemini() {
  console.log('\nTesting Gemini API Key...');
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is missing in .env');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Hello, are you working? Reply in 5 words.");
    const response = await result.response;
    const text = response.text();
    console.log('✅ Gemini API is working!');
    console.log('Response:', text);
  } catch (error) {
    console.error('❌ Gemini API Failed:', error.message);
  }
}

async function runTests() {
  await testOpenAI();
  await testGemini();
}

runTests();
