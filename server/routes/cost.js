const express = require('express');
const axios = require('axios');
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Material price database (can be extended with real APIs)
const MATERIAL_PRICES = {
  'concrete': { pricePerUnit: 150, unit: 'cubic_yard' },
  'steel': { pricePerUnit: 0.65, unit: 'pound' },
  'brick': { pricePerUnit: 0.35, unit: 'piece' },
  'wood': { pricePerUnit: 4.50, unit: 'board_foot' },
  'drywall': { pricePerUnit: 1.20, unit: 'square_foot' },
  'flooring': { pricePerUnit: 8.50, unit: 'square_foot' },
  'roofing': { pricePerUnit: 12.00, unit: 'square_foot' },
  'paint': { pricePerUnit: 35.00, unit: 'gallon' },
  'insulation': { pricePerUnit: 1.50, unit: 'square_foot' },
  'plumbing': { pricePerUnit: 5.00, unit: 'linear_foot' },
  'electrical': { pricePerUnit: 8.00, unit: 'linear_foot' },
  'windows': { pricePerUnit: 450.00, unit: 'piece' },
  'doors': { pricePerUnit: 350.00, unit: 'piece' }
};

// Labor rates by trade
const LABOR_RATES = {
  'general': { ratePerHour: 45.00 },
  'electrical': { ratePerHour: 65.00 },
  'plumbing': { ratePerHour: 60.00 },
  'roofing': { ratePerHour: 55.00 },
  'flooring': { ratePerHour: 50.00 },
  'painting': { ratePerHour: 40.00 },
  'drywall': { ratePerHour: 48.00 }
};

// Calculate basic cost estimation
function calculateBasicCosts(propertyDetails) {
  const { dimensions, type, materials = [] } = propertyDetails;
  const { length, width, height } = dimensions;
  
  const squareFootage = length * width;
  const volume = squareFootage * height;
  
  let materialsCost = 0;
  let laborCost = 0;
  const breakdown = [];

  // Calculate materials cost
  materials.forEach(material => {
    const materialInfo = MATERIAL_PRICES[material.type.toLowerCase()] || 
      { pricePerUnit: material.pricePerUnit || 0, unit: material.unit };
    
    const cost = material.quantity * materialInfo.pricePerUnit;
    materialsCost += cost;
    
    breakdown.push({
      category: 'Materials',
      item: material.type,
      quantity: material.quantity,
      unitCost: materialInfo.pricePerUnit,
      totalCost: cost
    });
  });

  // Basic labor estimation based on property type and size
  const laborMultiplier = {
    'residential': 35,
    'commercial': 45,
    'industrial': 55,
    'mixed-use': 50
  };

  laborCost = squareFootage * (laborMultiplier[type] || 40);
  
  breakdown.push({
    category: 'Labor',
    item: 'Construction Labor',
    quantity: squareFootage,
    unitCost: laborMultiplier[type] || 40,
    totalCost: laborCost
  });

  // Permits and fees (approximate 3-5% of construction cost)
  const permitsCost = (materialsCost + laborCost) * 0.04;
  
  breakdown.push({
    category: 'Permits',
    item: 'Building Permits & Fees',
    quantity: 1,
    unitCost: permitsCost,
    totalCost: permitsCost
  });

  // Equipment rental (approximate 8-12% of labor cost)
  const equipmentCost = laborCost * 0.10;
  
  breakdown.push({
    category: 'Equipment',
    item: 'Equipment Rental',
    quantity: 1,
    unitCost: equipmentCost,
    totalCost: equipmentCost
  });

  const total = materialsCost + laborCost + permitsCost + equipmentCost;

  return {
    materials: Math.round(materialsCost),
    labor: Math.round(laborCost),
    permits: Math.round(permitsCost),
    equipment: Math.round(equipmentCost),
    total: Math.round(total),
    breakdown,
    lastCalculated: new Date()
  };
}

// Get current material prices
router.get('/materials', auth, async (req, res) => {
  try {
    // In a real application, this would fetch from external APIs
    res.json({
      materials: MATERIAL_PRICES,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Calculate cost for a project
router.post('/:projectId/calculate', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to the project
    const hasAccess = project.owner.toString() === req.user._id.toString() ||
      project.collaborators.some(collab => collab.user.toString() === req.user._id.toString()) ||
      project.isPublic;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const costEstimation = calculateBasicCosts(project.propertyDetails);
    
    // Update project with new cost estimation
    project.costEstimation = costEstimation;
    await project.save();

    // Emit real-time update via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.projectId).emit('cost-updated', {
        projectId: req.params.projectId,
        costEstimation,
        updatedBy: req.user._id
      });
    }

    res.json({
      message: 'Cost calculated successfully',
      costEstimation
    });
  } catch (error) {
    console.error('Calculate cost error:', error);
    res.status(500).json({ message: 'Server error during cost calculation' });
  }
});

// Get cost estimation for a project
router.get('/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to the project
    const hasAccess = project.owner.toString() === req.user._id.toString() ||
      project.collaborators.some(collab => collab.user.toString() === req.user._id.toString()) ||
      project.isPublic;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      costEstimation: project.costEstimation || {},
      propertyDetails: project.propertyDetails
    });
  } catch (error) {
    console.error('Get cost estimation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update material prices (external API integration placeholder)
router.post('/materials/update', auth, async (req, res) => {
  try {
    // This would integrate with external APIs like material suppliers
    // For now, we'll simulate an update
    
    const updatedPrices = { ...MATERIAL_PRICES };
    
    // Simulate price fluctuations (±5%)
    Object.keys(updatedPrices).forEach(material => {
      const fluctuation = (Math.random() - 0.5) * 0.1; // ±5%
      updatedPrices[material].pricePerUnit *= (1 + fluctuation);
      updatedPrices[material].pricePerUnit = Math.round(updatedPrices[material].pricePerUnit * 100) / 100;
    });

    res.json({
      message: 'Material prices updated',
      materials: updatedPrices,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Update material prices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get market data (placeholder for Zillow API integration)
router.get('/market/:zipCode', auth, async (req, res) => {
  try {
    const { zipCode } = req.params;
    
    // This would integrate with Zillow API or similar
    // For now, we'll return simulated data
    const marketData = {
      zipCode,
      averageHomeValue: Math.floor(Math.random() * 500000) + 200000,
      pricePerSquareFoot: Math.floor(Math.random() * 200) + 100,
      marketTrend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)],
      comparableProperties: [
        {
          address: `${Math.floor(Math.random() * 9999)} Main St`,
          price: Math.floor(Math.random() * 600000) + 250000,
          squareFootage: Math.floor(Math.random() * 2000) + 1000,
          bedrooms: Math.floor(Math.random() * 4) + 2,
          bathrooms: Math.floor(Math.random() * 3) + 1
        }
      ],
      lastUpdated: new Date()
    };

    res.json(marketData);
  } catch (error) {
    console.error('Get market data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;