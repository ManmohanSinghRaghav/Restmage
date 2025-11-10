const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

/**
 * @route   POST /api/gemini/generate-map
 * @desc    Generate floor plan JSON from user requirements using Gemini AI
 * @access  Private
 */
router.post('/generate-map', auth, async (req, res) => {
  try {
    const { requirements } = req.body;

    if (!requirements) {
      return res.status(400).json({ error: 'Requirements are required' });
    }

    // Check if API key is configured
    if (!GEMINI_API_KEY) {
      console.warn('Gemini API key not configured, using fallback generator');
      return res.json({
        success: true,
        data: generateFallbackMap(requirements),
        source: 'fallback'
      });
    }

    // Prepare prompt for Gemini
    const prompt = buildGeminiPrompt(requirements);

    // Call Gemini API
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    // Extract and parse response
    const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No response from Gemini API');
    }

    // Extract JSON from response (Gemini might wrap it in markdown)
    const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) || 
                     generatedText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Gemini response');
    }

    const mapData = JSON.parse(jsonMatch[1] || jsonMatch[0]);

    // Validate map data structure
    if (!validateMapData(mapData)) {
      throw new Error('Invalid map data structure from Gemini');
    }

    res.json({
      success: true,
      data: mapData,
      source: 'gemini'
    });

  } catch (error) {
    console.error('Error generating map with Gemini:', error.message);

    // Fallback to basic generator on error
    try {
      const fallbackMap = generateFallbackMap(req.body.requirements);
      res.json({
        success: true,
        data: fallbackMap,
        source: 'fallback',
        warning: 'Used fallback generator due to Gemini API error'
      });
    } catch (fallbackError) {
      res.status(500).json({
        error: 'Failed to generate floor plan',
        details: error.message
      });
    }
  }
});

/**
 * Build a detailed prompt for Gemini AI
 */
function buildGeminiPrompt(requirements) {
  const {
    plotLength = 0,
    plotWidth = 0,
    floors = 1,
    bedrooms = 2,
    bathrooms = 1,
    kitchen = true,
    livingRoom = true,
    diningRoom = false,
    style = 'modern'
  } = requirements;

  return `You are an expert architect. Generate a detailed floor plan design in JSON format based on these requirements:

Plot Dimensions: ${plotLength}m x ${plotWidth}m
Number of Floors: ${floors}
Bedrooms: ${bedrooms}
Bathrooms: ${bathrooms}
Kitchen: ${kitchen ? 'Yes' : 'No'}
Living Room: ${livingRoom ? 'Yes' : 'No'}
Dining Room: ${diningRoom ? 'Yes' : 'No'}
Architectural Style: ${style}

Generate a JSON object with this EXACT structure:
{
  "plotDimensions": {
    "length": ${plotLength},
    "width": ${plotWidth}
  },
  "rooms": [
    {
      "id": "unique-id",
      "type": "bedroom|bathroom|kitchen|living|dining|hallway",
      "name": "Room Name",
      "x": <x-position-in-meters>,
      "y": <y-position-in-meters>,
      "width": <width-in-meters>,
      "height": <height-in-meters>,
      "color": "#hexcolor"
    }
  ],
  "walls": [
    {
      "id": "unique-id",
      "x1": <start-x>,
      "y1": <start-y>,
      "x2": <end-x>,
      "y2": <end-y>,
      "thickness": 0.2
    }
  ],
  "doors": [
    {
      "id": "unique-id",
      "roomId": "connected-room-id",
      "x": <position-x>,
      "y": <position-y>,
      "width": 0.9,
      "orientation": "horizontal|vertical"
    }
  ],
  "windows": [
    {
      "id": "unique-id",
      "roomId": "connected-room-id",
      "x": <position-x>,
      "y": <position-y>,
      "width": 1.2,
      "orientation": "horizontal|vertical"
    }
  ]
}

Rules:
1. All coordinates should be in meters
2. Rooms should NOT overlap
3. Ensure proper circulation space (hallways)
4. Place doors logically between rooms
5. Windows should be on outer walls
6. Use realistic room dimensions
7. Follow ${style} architectural principles

Return ONLY the JSON object, no additional text.`;
}

/**
 * Fallback generator for when Gemini API is unavailable
 */
function generateFallbackMap(requirements) {
  const {
    plotLength = 10,
    plotWidth = 10,
    bedrooms = 2,
    bathrooms = 1,
    kitchen = true,
    livingRoom = true
  } = requirements;

  const rooms = [];
  const walls = [];
  const doors = [];
  const windows = [];
  let currentY = 0;

  // Living room
  if (livingRoom) {
    rooms.push({
      id: 'room-living',
      type: 'living',
      name: 'Living Room',
      x: 0,
      y: currentY,
      width: plotWidth * 0.6,
      height: plotLength * 0.4,
      color: '#E3F2FD'
    });
    currentY += plotLength * 0.4;
  }

  // Kitchen
  if (kitchen) {
    rooms.push({
      id: 'room-kitchen',
      type: 'kitchen',
      name: 'Kitchen',
      x: plotWidth * 0.6,
      y: 0,
      width: plotWidth * 0.4,
      height: plotLength * 0.4,
      color: '#FFF3E0'
    });
  }

  // Bedrooms
  const bedroomWidth = plotWidth / bedrooms;
  for (let i = 0; i < bedrooms; i++) {
    rooms.push({
      id: `room-bedroom-${i + 1}`,
      type: 'bedroom',
      name: `Bedroom ${i + 1}`,
      x: i * bedroomWidth,
      y: currentY,
      width: bedroomWidth,
      height: plotLength * 0.4,
      color: '#F3E5F5'
    });
  }
  currentY += plotLength * 0.4;

  // Bathrooms
  const bathroomWidth = plotWidth / bathrooms;
  for (let i = 0; i < bathrooms; i++) {
    rooms.push({
      id: `room-bathroom-${i + 1}`,
      type: 'bathroom',
      name: `Bathroom ${i + 1}`,
      x: i * bathroomWidth,
      y: currentY,
      width: bathroomWidth,
      height: plotLength * 0.2,
      color: '#E0F2F1'
    });
  }

  return {
    plotDimensions: {
      length: plotLength,
      width: plotWidth
    },
    rooms,
    walls,
    doors,
    windows,
    metadata: {
      generatedAt: new Date().toISOString(),
      generator: 'fallback',
      version: '1.0'
    }
  };
}

/**
 * Validate map data structure
 */
function validateMapData(data) {
  if (!data || typeof data !== 'object') return false;
  if (!data.plotDimensions || !data.rooms) return false;
  if (!Array.isArray(data.rooms)) return false;
  
  // Validate each room has required fields
  for (const room of data.rooms) {
    if (!room.id || !room.type || typeof room.x !== 'number' || typeof room.y !== 'number') {
      return false;
    }
  }
  
  return true;
}

module.exports = router;
