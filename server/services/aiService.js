const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_API_MODEL || 'gemini-2.0-flash' });

/**
 * Generates a structured floorplan layout using Gemini AI
 * @param {Object} params - Dimensions and preferences
 * @returns {Promise<Object>} - The generated floorplan JSON
 */
exports.generateFloorplan = async (params) => {
  const { width, height, rooms, style } = params;

  const prompt = `
    Generate a realistic architectural floorplan layout for a property with dimensions ${width}x${height} meters.
    The property should include: ${rooms || 'living room, kitchen, and 2 bedrooms'}.
    Design style: ${style || 'modern'}.
    
    Return the result ONLY as a JSON object with the following structure:
    {
      "dimensions": { "width": ${width}, "height": ${height} },
      "rooms": [
        { "name": "Room Name", "x": 0, "y": 0, "width": 4, "height": 4, "color": "#hex" }
      ],
      "walls": [
        { "x1": 0, "y1": 0, "x2": 10, "y2": 0 }
      ]
    }
    
    Ensure all rooms fit within the total dimensions and don't overlap excessively.
    Provide a professional, functional layout.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from potential markdown code blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Invalid AI response format');
  } catch (error) {
    console.error('Gemini Floorplan Error:', error);
    throw error;
  }
};
