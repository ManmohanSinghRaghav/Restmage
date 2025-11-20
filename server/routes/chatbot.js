const express = require('express');
const axios = require('axios');
const { auth } = require('../middleware/auth');

const router = express.Router();

/**
 * Chatbot for Real Estate Assistance
 * Uses OpenAI ChatGPT API for intelligent responses
 * Falls back to rule-based responses if API is unavailable
 */

// System prompt for ChatGPT
const SYSTEM_PROMPT = `You are a smart, friendly real estate assistant specializing in the Indian subcontinent (India, Pakistan, Bangladesh, Nepal, Sri Lanka, Bhutan). Tailor answers to local context: use common units (sq ft / sq m), default to INR for price examples unless user specifies another local currency, and use local real-estate terms (e.g., BHK, builder-floor, independent house, plot, FAR, RERA where applicable).

Key focus areas:
- Floor plan design & layout optimization for Indian homes (consider Vastu preferences if asked)
- Price estimation and market drivers (location, carpet vs super built-up area, amenities, city/region variance)
- Room sizes, typical measurements, and efficient use of space in Indian housing
- Construction materials & monsoon/heat-resilient design, rainwater harvesting, solar options
- Local compliance hints (approvals, RERA mentions) — do not give legal/financial advice; recommend consulting local experts
- Ask clarifying questions: city/state, budget, total area, number of BHKs, and priority features

Keep responses concise (under 200 words) unless the user requests more detail. Be practical, culturally aware, and ask follow-up questions to refine recommendations.`;

// Knowledge base for real estate chatbot
const KNOWLEDGE_BASE = {
  greetings: [
    'Hello! I\'m your real estate assistant. How can I help you today?',
    'Hi there! I can help you with floor plans, price estimates, and property questions.',
    'Welcome! Ask me anything about designing your dream home.'
  ],
  floorPlan: {
    keywords: ['floor plan', 'layout', 'design', 'room', 'bedroom', 'bathroom', 'kitchen'],
    responses: [
      'I can help you generate a custom floor plan! Just tell me:\n1. Property width and height (in feet)\n2. How many bedrooms, bathrooms, and other rooms you need\n\nFor example: "I need a floor plan for a 50x40 feet property with 3 bedrooms, 2 bathrooms, 1 kitchen, and 1 living room"',
      'To create your floor plan, I need:\n- Property dimensions (width x height)\n- Number and types of rooms (bedrooms, bathrooms, kitchen, living room, etc.)\n\nWhat are your requirements?'
    ]
  },
  pricing: {
    keywords: ['price', 'cost', 'value', 'estimate', 'worth', 'how much'],
    responses: [
      'I can estimate property prices! I\'ll need:\n- Total area (square feet)\n- Number of bedrooms and bathrooms\n- Property age\n- Location type (urban/suburban/rural)\n- Condition (excellent/good/fair/poor)\n- Amenities (garage, pool, garden, etc.)\n\nWhat property would you like me to evaluate?',
      'For price prediction, please provide:\n✓ Square footage\n✓ Bedrooms & bathrooms\n✓ Age of property\n✓ Location and condition\n✓ Special amenities\n\nI\'ll give you an estimated price range!'
    ]
  },
  roomSizes: {
    keywords: ['room size', 'how big', 'dimensions', 'square feet'],
    responses: [
      'Standard room sizes:\n• Bedroom: 150 sq ft\n• Bathroom: 50 sq ft\n• Kitchen: 120 sq ft\n• Living Room: 200 sq ft\n• Dining Room: 150 sq ft\n• Store Room: 60 sq ft\n\nThese are typical sizes, but can be customized!'
    ]
  },
  features: {
    keywords: ['feature', 'can you', 'what do', 'help with', 'capability'],
    responses: [
      'I can help you with:\n\n🏠 Floor Plan Generation\n- Create custom 2D layouts based on your needs\n- Optimize room placement for efficiency\n\n💰 Price Prediction\n- Estimate property values\n- Compare different configurations\n- Market trend analysis\n\n📐 Room Planning\n- Suggest optimal room sizes\n- Calculate total area requirements\n\n❓ General Advice\n- Property buying tips\n- Design recommendations\n\nWhat would you like to explore?'
    ]
  },
  tips: {
    keywords: ['tip', 'advice', 'suggest', 'recommend', 'should i'],
    responses: [
      '💡 Here are some tips:\n\n1. Location is key - Urban areas command 50-100% price premiums\n2. Bigger isn\'t always better - Focus on efficient layouts\n3. Natural light - Place living areas facing south/east\n4. Future-proof - Consider resale value\n5. Modern amenities increase value by 15-30%',
      '🏡 Property Design Tips:\n\n✓ Keep bedrooms away from noisy areas\n✓ Kitchen should be near dining room\n✓ Bathrooms should have good ventilation\n✓ Storage is essential - don\'t skip store rooms\n✓ Consider traffic flow between rooms\n\nWant specific advice for your project?'
    ]
  }
};

/**
 * Generate chatbot response using OpenAI ChatGPT API
 */
async function generateChatGPTResponse(message) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Fallback function for rule-based responses
 */
function generateFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();

  // Check for greetings
  if (lowerMessage.match(/\b(hi|hello|hey|greetings)\b/)) {
    return getRandomResponse(KNOWLEDGE_BASE.greetings);
  }

  // Check each knowledge category
  for (const [category, data] of Object.entries(KNOWLEDGE_BASE)) {
    if (category === 'greetings') continue;

    const matched = data.keywords.some(keyword => lowerMessage.includes(keyword));
    if (matched) {
      return getRandomResponse(data.responses);
    }
  }

  // Extract numbers and room types from message
  const roomMatch = lowerMessage.match(/(\d+)\s*(bedroom|bathroom|kitchen|living room|dining room)/g);
  if (roomMatch) {
    return `I see you're interested in a property with ${roomMatch.join(', ')}. To generate a detailed floor plan, please provide the property dimensions (width x height in feet). For example: "50 feet by 40 feet" or "50x40".`;
  }

  // Extract dimensions
  const dimensionMatch = lowerMessage.match(/(\d+)\s*(?:x|by|×)\s*(\d+)/);
  if (dimensionMatch) {
    return `Perfect! For a ${dimensionMatch[1]}x${dimensionMatch[2]} feet property, I can create a floor plan. How many bedrooms, bathrooms, and other rooms would you like?`;
  }

  // Default response
  return `I'm here to help with floor plan design and price estimation! You can ask me about:

• Generating floor plans
• Estimating property prices
• Room size recommendations
• Design tips and advice

What would you like to know?`;
}

function getRandomResponse(responses) {
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * POST /api/chatbot/message
 * Send a message to the chatbot
 */
router.post('/message', auth, async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required' });
    }

    let response;
    let source = 'chatgpt';

    try {
      // Try to use ChatGPT API first
      console.log('Attempting to use ChatGPT API...');
      response = await generateChatGPTResponse(message);
      console.log('✅ ChatGPT API responded successfully');
    } catch (error) {
      // Fallback to rule-based if ChatGPT fails
      console.warn('⚠️  ChatGPT unavailable, using fallback:', error.message);
      response = generateFallbackResponse(message);
      source = 'rule-based';
    }

    res.json({
      success: true,
      conversationId: conversationId || `conv_${Date.now()}`,
      userMessage: message,
      botResponse: response,
      source,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ message: 'Chatbot service unavailable' });
  }
});

/**
 * POST /api/chatbot/huggingface
 * Use Hugging Face free API for advanced NLP (Optional enhancement)
 * You can get free API key from: https://huggingface.co/settings/tokens
 */
router.post('/huggingface', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

    if (!HF_API_KEY) {
      // Fallback to rule-based if no API key
      const response = generateChatbotResponse(message);
      return res.json({
        success: true,
        botResponse: response,
        source: 'rule-based',
        note: 'Set HUGGINGFACE_API_KEY in .env for enhanced AI responses'
      });
    }

    // Call Hugging Face API
    const fetch = (await import('node-fetch')).default;
    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: message,
          parameters: {
            max_length: 200,
            temperature: 0.7
          }
        })
      }
    );

    if (!hfResponse.ok) {
      throw new Error('Hugging Face API error');
    }

    const data = await hfResponse.json();
    const aiResponse = data[0]?.generated_text || generateChatbotResponse(message);

    res.json({
      success: true,
      botResponse: aiResponse,
      source: 'huggingface-ai',
      model: 'facebook/blenderbot-400M-distill'
    });
  } catch (error) {
    console.error('Hugging Face API error:', error);
    // Fallback to rule-based
    const response = generateChatbotResponse(req.body.message);
    res.json({
      success: true,
      botResponse: response,
      source: 'rule-based-fallback'
    });
  }
});

/**
 * GET /api/chatbot/suggestions
 * Get suggested questions/topics
 */
router.get('/suggestions', (req, res) => {
  const suggestions = [
    'Generate a floor plan for 3 bedroom house',
    'What is the price of a 2000 sq ft house?',
    'What are standard room sizes?',
    'Give me tips for property design',
    'How do I optimize my floor plan?',
    'What amenities increase property value?',
    'Compare prices for different configurations'
  ];

  res.json({ suggestions });
});

module.exports = router;
