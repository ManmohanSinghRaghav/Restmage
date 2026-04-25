const express = require('express');
const axios = require('axios');
const { auth } = require('../middleware/auth');
const OpenAI = require('openai');
const Message = require('../models/Message');

const router = express.Router();

// Initialize OpenAI conditionally
let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Chatbot for Real Estate Assistance
 * Uses rule-based responses with contextual understanding
 * Can be enhanced with Hugging Face API for more advanced NLP
 */

// Knowledge base for real estate chatbot (Fallback)
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
 * Analyze user message and generate appropriate response
 */
function generateChatbotResponse(message) {
  const lowerMessage = message.toLowerCase();

  // Check for greetings
  if (lowerMessage.match(/\b(hi|hello|hey|greetings)\b/)) {
    return getRandomResponse(KNOWLEDGE_BASE.greetings);
  }

  // Check for floor plan related queries
  for (const keyword of KNOWLEDGE_BASE.floorPlan.keywords) {
    if (lowerMessage.includes(keyword)) {
      return getRandomResponse(KNOWLEDGE_BASE.floorPlan.responses);
    }
  }

  // Check for pricing related queries
  for (const keyword of KNOWLEDGE_BASE.pricing.keywords) {
    if (lowerMessage.includes(keyword)) {
      return getRandomResponse(KNOWLEDGE_BASE.pricing.responses);
    }
  }

  // Check for room size queries
  for (const keyword of KNOWLEDGE_BASE.roomSizes.keywords) {
    if (lowerMessage.includes(keyword)) {
      return getRandomResponse(KNOWLEDGE_BASE.roomSizes.responses);
    }
  }

  // Check for feature/capability inquiries
  for (const keyword of KNOWLEDGE_BASE.features.keywords) {
    if (lowerMessage.includes(keyword)) {
      return getRandomResponse(KNOWLEDGE_BASE.features.responses);
    }
  }

  // Check for tips and advice
  for (const keyword of KNOWLEDGE_BASE.tips.keywords) {
    if (lowerMessage.includes(keyword)) {
      return getRandomResponse(KNOWLEDGE_BASE.tips.responses);
    }
  }

  // Default response
  return `I'm here to help with floor plan design and price estimation! You can ask me about:

• Generating floor plans
• Estimating property prices
• Room size recommendations
• Design tips and advice

What would you like to know?`;
}

/**
 * Generate response using OpenAI GPT
 */
async function generateAIResponse(message) {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a helpful and knowledgeable Real Estate Assistant for the Restmage application. You help users with floor plan designs, property price estimation, and general real estate advice. Be professional, concise, and friendly. If asked about floor plans, ask for dimensions and room requirements. If asked about price, ask for location, area, and amenities." 
        },
        { role: "user", content: message }
      ],
      model: "gpt-3.5-turbo",
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
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
    let source = 'rule-based';

    // Try OpenAI if API key is present
    if (process.env.OPENAI_API_KEY) {
      try {
        response = await generateAIResponse(message);
        source = 'openai';
      } catch (err) {
        console.warn('OpenAI failed, falling back to rules:', err.message);
        response = generateChatbotResponse(message);
      }
    } else {
      response = generateChatbotResponse(message);
    }

    // Save user message
    const userMsg = new Message({
      conversationId: conversationId || `conv_${Date.now()}`,
      user: req.user._id,
      role: 'user',
      content: message,
      source: 'user'
    });
    await userMsg.save();

    // Save bot response
    const botMsg = new Message({
      conversationId: userMsg.conversationId,
      user: req.user._id,
      role: 'assistant',
      content: response,
      source: source
    });
    await botMsg.save();

    res.json({
      success: true,
      conversationId: userMsg.conversationId,
      userMessage: message,
      botResponse: response,
      source,
      timestamp: botMsg.createdAt
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

/**
 * GET /api/chatbot/history/:conversationId
 * Get chat history
 */
router.get('/history/:conversationId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
      user: req.user._id
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
});

module.exports = router;
