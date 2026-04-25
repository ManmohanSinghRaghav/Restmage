const aiService = require('../services/aiService');

exports.generateFloorplan = async (req, res) => {
  try {
    const { width, height, rooms, style } = req.body;
    
    if (!width || !height) {
      return res.status(400).json({ message: 'Width and height are required' });
    }

    const floorplan = await aiService.generateFloorplan({ width, height, rooms, style });
    res.json(floorplan);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to generate floorplan with AI',
      error: error.message 
    });
  }
};
