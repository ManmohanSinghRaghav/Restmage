const express = require('express');
const { auth } = require('../middleware/auth');
const { generateFloorPlan } = require('../services/geminiFloorPlan');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { env } = require('process');
const FloorPlan = require('../models/FloorPlan');

const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Floor Plan Generator Algorithm
 * Generates a 2D floor plan based on room requirements and property dimensions
 */

// Helper function to calculate optimal room placement
function generateAlgorithmicFloorPlan(propertyWidth, propertyHeight, rooms) {
  const floorPlan = {
    propertyDimensions: {
      width: propertyWidth,
      height: propertyHeight,
      totalArea: propertyWidth * propertyHeight
    },
    rooms: [],
    metadata: {
      generatedAt: new Date().toISOString(),
      totalRooms: rooms.length,
      efficiency: 0
    }
  };

  // Calculate total required area
  let totalRequiredArea = 0;
  const roomSizes = {
    bedroom: 150, // sq ft
    bathroom: 50,
    kitchen: 120,
    'living room': 200,
    'dining room': 150,
    'store room': 60,
    'drawing room': 180,
    hall: 200,
    balcony: 80,
    garage: 200
  };

  // Sort rooms by size (larger rooms first)
  const sortedRooms = rooms.sort((a, b) => {
    const sizeA = roomSizes[a.type.toLowerCase()] || 100;
    const sizeB = roomSizes[b.type.toLowerCase()] || 100;
    return sizeB - sizeA;
  });

  // Simple grid-based layout algorithm
  let currentX = 0;
  let currentY = 0;
  let rowHeight = 0;
  const padding = 5; // 5 feet padding between rooms

  sortedRooms.forEach((room, index) => {
    const baseSize = roomSizes[room.type.toLowerCase()] || 100;
    let roomWidth = Math.sqrt(baseSize);
    let roomHeight = Math.sqrt(baseSize);

    // Adjust for custom count (if bedroom x2, split the space)
    if (room.count && room.count > 1) {
      roomWidth = roomWidth * Math.sqrt(room.count);
    }

    // Check if room fits in current row
    if (currentX + roomWidth > propertyWidth) {
      currentX = 0;
      currentY += rowHeight + padding;
      rowHeight = 0;
    }

    // Check if we have vertical space
    if (currentY + roomHeight > propertyHeight) {
      // Scale down if necessary
      const scale = (propertyHeight - currentY) / roomHeight;
      roomHeight *= scale * 0.9; // 90% to leave some margin
      roomWidth *= scale * 0.9;
    }

    const roomData = {
      id: `room_${index}`,
      type: room.type,
      count: room.count || 1,
      dimensions: {
        width: Math.round(roomWidth * 100) / 100,
        height: Math.round(roomHeight * 100) / 100,
        area: Math.round(roomWidth * roomHeight * 100) / 100
      },
      position: {
        x: Math.round(currentX * 100) / 100,
        y: Math.round(currentY * 100) / 100
      },
      color: getColorForRoomType(room.type),
      walls: [
        { start: { x: currentX, y: currentY }, end: { x: currentX + roomWidth, y: currentY } },
        { start: { x: currentX + roomWidth, y: currentY }, end: { x: currentX + roomWidth, y: currentY + roomHeight } },
        { start: { x: currentX + roomWidth, y: currentY + roomHeight }, end: { x: currentX, y: currentY + roomHeight } },
        { start: { x: currentX, y: currentY + roomHeight }, end: { x: currentX, y: currentY } }
      ]
    };

    floorPlan.rooms.push(roomData);
    totalRequiredArea += roomData.dimensions.area;

    currentX += roomWidth + padding;
    rowHeight = Math.max(rowHeight, roomHeight);
  });

  // Calculate efficiency
  floorPlan.metadata.efficiency = Math.round((totalRequiredArea / floorPlan.propertyDimensions.totalArea) * 100);
  floorPlan.metadata.usedArea = Math.round(totalRequiredArea);
  floorPlan.metadata.wastedArea = Math.round(floorPlan.propertyDimensions.totalArea - totalRequiredArea);

  return floorPlan;
}

/**
 * Generate Floor Plan using Gemini AI
 */
async function generateGeminiFloorPlan(propertyWidth, propertyHeight, rooms) {
  try {
    // Using Gemini 1.5 Flash for faster and more efficient generation
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_API_MODEL || "gemini-1.5-flash" });

    const prompt = `
      Generate a 2D floor plan JSON for a property of size ${propertyWidth}x${propertyHeight} feet.
      Rooms required: ${JSON.stringify(rooms)}.
      
      The output must be a valid JSON object with this exact structure:
      {
        "propertyDimensions": { "width": number, "height": number, "totalArea": number },
        "rooms": [
          {
            "id": "string",
            "type": "string",
            "dimensions": { "width": number, "height": number, "area": number },
            "position": { "x": number, "y": number },
            "walls": [
              { "start": { "x": number, "y": number }, "end": { "x": number, "y": number } },
              ... (4 walls for rectangular room)
            ],
            "color": "string (hex code)"
          }
        ],
        "metadata": { "efficiency": number }
      }
      
      Ensure rooms do not overlap and fit within the property dimensions.
      Return ONLY the JSON string, no markdown formatting.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up markdown code blocks if present
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

// Helper function to assign colors to room types
function getColorForRoomType(roomType) {
  const colors = {
    bedroom: '#FFB6C1',
    bathroom: '#87CEEB',
    kitchen: '#FFD700',
    'living room': '#98FB98',
    'dining room': '#DDA0DD',
    'store room': '#F0E68C',
    'drawing room': '#FFA07A',
    hall: '#E0E0E0',
    balcony: '#B0E0E6',
    garage: '#D3D3D3'
  };
  return colors[roomType.toLowerCase()] || '#CCCCCC';
}

/**
 * POST /api/floorplan/generate
 * Generate a 2D floor plan based on requirements
 */
router.post('/generate', auth, async (req, res) => {
  try {
    const { propertyWidth, propertyHeight, rooms } = req.body;

    // Validation
    if (!propertyWidth || !propertyHeight || !rooms || rooms.length === 0) {
      return res.status(400).json({ 
        message: 'Property dimensions and rooms are required',
        required: {
          propertyWidth: 'number (in feet)',
          propertyHeight: 'number (in feet)',
          rooms: 'array of {type: string, count: number}'
        }
      });
    }

    if (propertyWidth <= 0 || propertyHeight <= 0) {
      return res.status(400).json({ message: 'Property dimensions must be positive numbers' });
    }

    if (rooms.some(room => !room.type)) {
      return res.status(400).json({ message: 'Each room must have a type' });
    }

    let floorPlan;
    let source = 'gemini';

    // Try Gemini AI first
    if (process.env.GEMINI_API_KEY) {
      try {
        floorPlan = await generateGeminiFloorPlan(propertyWidth, propertyHeight, rooms);
      } catch (err) {
        console.warn('Gemini AI failed, falling back to algorithm:', err.message);
        floorPlan = generateAlgorithmicFloorPlan(propertyWidth, propertyHeight, rooms);
        source = 'algorithm-fallback';
      }
    } else {
      floorPlan = generateAlgorithmicFloorPlan(propertyWidth, propertyHeight, rooms);
      source = 'algorithm';
    }

    // Prepare data for saving
    let floorPlanData = {};
    if (source === 'gemini') {
        floorPlanData = {
            mapInfo: floorPlan.map_info,
            plotSummary: floorPlan.plot_summary,
            rooms: floorPlan.rooms,
            walls: floorPlan.walls,
            doors: floorPlan.doors,
            windows: floorPlan.windows,
            fixtures: floorPlan.fixtures
        };
    } else {
        floorPlanData = {
            plotSummary: {
                plot_width_ft: floorPlan.propertyDimensions.width,
                plot_length_ft: floorPlan.propertyDimensions.height
            },
            rooms: floorPlan.rooms,
            walls: floorPlan.walls,
            doors: floorPlan.doors,
            windows: floorPlan.windows
        };
    }

    // Save to MongoDB
    const newFloorPlan = new FloorPlan({
      project: req.body.projectId || null,
      name: req.body.name || `Generated Floor Plan ${new Date().toLocaleDateString()}`,
      ...floorPlanData,
      generatedBy: source === 'gemini' ? 'ai' : 'manual',
      generationInputs: { propertyWidth, propertyHeight, rooms },
      isActive: true,
      createdBy: req.user._id
    });
    await newFloorPlan.save();

    res.json({
      success: true,
      message: 'Floor plan generated successfully',
      floorPlan,
      floorPlanId: newFloorPlan._id,
      source
    });
  } catch (error) {
    console.error('Floor plan generation error:', error);
    res.status(500).json({ 
      message: 'Failed to generate floor plan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/floorplan/optimize
 * Optimize an existing floor plan for better space utilization
 */
router.post('/optimize', auth, async (req, res) => {
  try {
    const { propertyWidth, propertyHeight, rooms } = req.body;

    // Generate multiple layouts and pick the best
    const layouts = [];
    for (let i = 0; i < 3; i++) {
      const shuffledRooms = [...rooms].sort(() => Math.random() - 0.5);
      const layout = generateAlgorithmicFloorPlan(propertyWidth, propertyHeight, shuffledRooms);
      layouts.push(layout);
    }

    // Select layout with best efficiency
    const bestLayout = layouts.reduce((best, current) => {
      return current.metadata.efficiency > best.metadata.efficiency ? current : best;
    });

    res.json({
      success: true,
      message: 'Optimized floor plan generated',
      floorPlan: bestLayout,
      alternatives: layouts.filter(l => l !== bestLayout).slice(0, 2)
    });
  } catch (error) {
    console.error('Floor plan optimization error:', error);
    res.status(500).json({ message: 'Failed to optimize floor plan' });
  }
});

/**
 * GET /api/floorplan/room-types
 * Get available room types and their standard sizes
 */
router.get('/room-types', (req, res) => {
  const roomTypes = [
    { type: 'Bedroom', standardSize: 150, unit: 'sq ft', description: 'Standard bedroom' },
    { type: 'Bathroom', standardSize: 50, unit: 'sq ft', description: 'Full bathroom' },
    { type: 'Kitchen', standardSize: 120, unit: 'sq ft', description: 'Modern kitchen' },
    { type: 'Living Room', standardSize: 200, unit: 'sq ft', description: 'Family living space' },
    { type: 'Dining Room', standardSize: 150, unit: 'sq ft', description: 'Dining area' },
    { type: 'Store Room', standardSize: 60, unit: 'sq ft', description: 'Storage space' },
    { type: 'Drawing Room', standardSize: 180, unit: 'sq ft', description: 'Formal sitting area' },
    { type: 'Hall', standardSize: 200, unit: 'sq ft', description: 'Entry hall' },
    { type: 'Balcony', standardSize: 80, unit: 'sq ft', description: 'Outdoor balcony' },
    { type: 'Garage', standardSize: 200, unit: 'sq ft', description: 'Car parking' }
  ];

  res.json({ roomTypes });
});

/**
 * POST /api/floorplan/generate-ai
 * Generate floor plan using Gemini AI
 */
router.post('/generate-ai', auth, async (req, res) => {
  try {
    console.log('Generating AI floor plan with inputs:', req.body);

    const floorPlan = await generateFloorPlan(req.body);

    res.json({
      success: true,
      message: 'AI floor plan generated successfully',
      floorPlan,
    });
  } catch (error) {
    console.error('AI floor plan generation error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI floor plan',
      error: error.message,
    });
  }
});

// ============================================
// CRUD OPERATIONS FOR FLOOR PLANS
// ============================================

const Project = require('../models/Project');

/**
 * GET /api/floorplan/list
 * List all floor plans for current user
 */
router.get('/list', auth, async (req, res) => {
  try {
    const { projectId } = req.query;
    const query = { createdBy: req.user._id };
    
    if (projectId) {
      query.project = projectId;
    }

    const floorPlans = await FloorPlan.find(query)
      .populate('project', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      floorPlans: floorPlans,
      data: floorPlans
    });
  } catch (error) {
    console.error('Error fetching floor plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch floor plans',
      error: error.message
    });
  }
});

/**
 * GET /api/floorplan/:id
 * Get single floor plan by ID
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const floorPlan = await FloorPlan.findById(req.params.id)
      .populate('project', 'name');

    if (!floorPlan) {
      return res.status(404).json({
        success: false,
        message: 'Floor plan not found'
      });
    }

    res.json({
      success: true,
      floorPlan: floorPlan,
      data: floorPlan
    });
  } catch (error) {
    console.error('Error fetching floor plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch floor plan',
      error: error.message
    });
  }
});

/**
 * POST /api/floorplan/save
 * Save a new floor plan to MongoDB
 */
router.post('/save', auth, async (req, res) => {
  try {
    const {
      project,
      name,
      map_info,
      plot_summary,
      rooms,
      walls,
      doors,
      windows,
      fixtures,
      stairs,
      generatedBy,
      generationInputs,
      isActive
    } = req.body;

    const floorPlan = new FloorPlan({
      project: project || null,
      name: name || `Floor Plan - ${new Date().toLocaleDateString()}`,
      mapInfo: map_info,
      plotSummary: plot_summary,
      rooms: rooms || [],
      walls: walls || [],
      doors: doors || [],
      windows: windows || [],
      fixtures: fixtures || [],
      stairs: stairs || [],
      generatedBy: generatedBy || 'manual',
      generationInputs: generationInputs || {},
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id
    });

    await floorPlan.save();

    // Update project's active floor plan if project specified
    if (project) {
      await Project.findByIdAndUpdate(project, {
        activeFloorPlan: floorPlan._id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Floor plan saved successfully',
      floorPlan: floorPlan,
      data: floorPlan,
      _id: floorPlan._id
    });
  } catch (error) {
    console.error('Error saving floor plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save floor plan',
      error: error.message
    });
  }
});

/**
 * PUT /api/floorplan/:id
 * Update floor plan
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const floorPlan = await FloorPlan.findById(req.params.id);

    if (!floorPlan) {
      return res.status(404).json({
        success: false,
        message: 'Floor plan not found'
      });
    }

    // Update fields
    const updateFields = [
      'name', 'mapInfo', 'plotSummary', 'rooms', 'walls', 
      'doors', 'windows', 'fixtures', 'stairs', 'isActive'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        floorPlan[field] = req.body[field];
      }
    });

    // Handle snake_case from frontend
    if (req.body.map_info) floorPlan.mapInfo = req.body.map_info;
    if (req.body.plot_summary) floorPlan.plotSummary = req.body.plot_summary;

    await floorPlan.save();

    res.json({
      success: true,
      message: 'Floor plan updated successfully',
      floorPlan: floorPlan,
      data: floorPlan
    });
  } catch (error) {
    console.error('Error updating floor plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update floor plan',
      error: error.message
    });
  }
});

/**
 * DELETE /api/floorplan/:id
 * Delete floor plan
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const floorPlan = await FloorPlan.findById(req.params.id);

    if (!floorPlan) {
      return res.status(404).json({
        success: false,
        message: 'Floor plan not found'
      });
    }

    await FloorPlan.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Floor plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting floor plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete floor plan',
      error: error.message
    });
  }
});

module.exports = router;
