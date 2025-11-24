const express = require('express');
const { auth } = require('../middleware/auth');
const CostEstimate = require('../models/CostEstimate');
const FloorPlan = require('../models/FloorPlan');
const Project = require('../models/Project');

const router = express.Router();

// Material price database (INR prices)
const MATERIAL_PRICES = {
  'concrete': { pricePerUnit: 5500, unit: 'cubic_meter' },
  'steel': { pricePerUnit: 65, unit: 'kg' },
  'brick': { pricePerUnit: 8, unit: 'piece' },
  'wood': { pricePerUnit: 450, unit: 'sq_ft' },
  'drywall': { pricePerUnit: 120, unit: 'sq_ft' },
  'flooring': { pricePerUnit: 850, unit: 'sq_ft' },
  'roofing': { pricePerUnit: 1200, unit: 'sq_ft' },
  'paint': { pricePerUnit: 3500, unit: 'gallon' },
  'insulation': { pricePerUnit: 150, unit: 'sq_ft' },
  'plumbing': { pricePerUnit: 500, unit: 'linear_ft' },
  'electrical': { pricePerUnit: 800, unit: 'linear_ft' },
  'windows': { pricePerUnit: 12000, unit: 'piece' },
  'doors': { pricePerUnit: 8000, unit: 'piece' }
};

// Labor rates by trade (INR per hour)
const LABOR_RATES = {
  'general': 400,
  'electrical': 650,
  'plumbing': 600,
  'roofing': 550,
  'flooring': 500,
  'painting': 350,
  'drywall': 450
};

/**
 * Calculate cost estimation based on property details and floor plan
 */
function calculateCosts(propertyDetails, floorPlan = null) {
  const breakdown = [];
  
  // Extract dimensions
  let squareFootage = 0;
  if (propertyDetails.dimensions) {
    const { length, width } = propertyDetails.dimensions;
    squareFootage = length * width;
  } else if (floorPlan && floorPlan.plotSummary) {
    squareFootage = floorPlan.plotSummary.plot_length_ft * floorPlan.plotSummary.plot_width_ft;
  }

  // Calculate materials cost
  let materialsCost = 0;
  const materials = propertyDetails.materials || [];
  
  materials.forEach(material => {
    const materialInfo = MATERIAL_PRICES[material.type.toLowerCase()] || 
      { pricePerUnit: material.pricePerUnit || 0, unit: material.unit };
    
    const cost = material.quantity * materialInfo.pricePerUnit;
    materialsCost += cost;
    
    breakdown.push({
      category: 'Materials',
      item: material.type,
      quantity: material.quantity,
      unit: materialInfo.unit,
      unitCost: materialInfo.pricePerUnit,
      totalCost: cost
    });
  });

  // Basic construction materials based on square footage
  if (squareFootage > 0 && materials.length === 0) {
    // Concrete for foundation
    const concreteQty = squareFootage * 0.15; // approx 0.15 cubic meters per sq ft
    const concreteCost = concreteQty * MATERIAL_PRICES.concrete.pricePerUnit;
    materialsCost += concreteCost;
    breakdown.push({
      category: 'Materials',
      item: 'Concrete (Foundation)',
      quantity: concreteQty,
      unit: 'cubic_meter',
      unitCost: MATERIAL_PRICES.concrete.pricePerUnit,
      totalCost: concreteCost
    });

    // Bricks for walls
    const brickQty = squareFootage * 8; // approx 8 bricks per sq ft
    const brickCost = brickQty * MATERIAL_PRICES.brick.pricePerUnit;
    materialsCost += brickCost;
    breakdown.push({
      category: 'Materials',
      item: 'Bricks',
      quantity: brickQty,
      unit: 'piece',
      unitCost: MATERIAL_PRICES.brick.pricePerUnit,
      totalCost: brickCost
    });

    // Steel reinforcement
    const steelQty = squareFootage * 4; // approx 4 kg per sq ft
    const steelCost = steelQty * MATERIAL_PRICES.steel.pricePerUnit;
    materialsCost += steelCost;
    breakdown.push({
      category: 'Materials',
      item: 'Steel Reinforcement',
      quantity: steelQty,
      unit: 'kg',
      unitCost: MATERIAL_PRICES.steel.pricePerUnit,
      totalCost: steelCost
    });
  }

  // Count rooms if floor plan available
  let roomCount = 0;
  if (floorPlan && floorPlan.rooms) {
    roomCount = floorPlan.rooms.length;
    
    // Add doors and windows based on room count
    const doorCost = roomCount * MATERIAL_PRICES.doors.pricePerUnit;
    const windowCost = roomCount * 1.5 * MATERIAL_PRICES.windows.pricePerUnit;
    
    materialsCost += doorCost + windowCost;
    
    breakdown.push({
      category: 'Materials',
      item: 'Doors',
      quantity: roomCount,
      unit: 'piece',
      unitCost: MATERIAL_PRICES.doors.pricePerUnit,
      totalCost: doorCost
    });
    
    breakdown.push({
      category: 'Materials',
      item: 'Windows',
      quantity: roomCount * 1.5,
      unit: 'piece',
      unitCost: MATERIAL_PRICES.windows.pricePerUnit,
      totalCost: windowCost
    });
  }

  // Labor cost calculation
  const type = propertyDetails.type || 'residential';
  const laborMultiplier = {
    'residential': 1200,
    'commercial': 1500,
    'industrial': 1800,
    'mixed-use': 1400
  };

  const laborCost = squareFootage * (laborMultiplier[type] || 1200);
  
  breakdown.push({
    category: 'Labor',
    item: 'Construction Labor',
    quantity: squareFootage,
    unit: 'sq_ft',
    unitCost: laborMultiplier[type] || 1200,
    totalCost: laborCost
  });

  // Permits and fees (3-5% of construction cost)
  const permitsCost = (materialsCost + laborCost) * 0.04;
  
  breakdown.push({
    category: 'Permits',
    item: 'Building Permits & Fees',
    quantity: 1,
    unit: 'lump_sum',
    unitCost: permitsCost,
    totalCost: permitsCost
  });

  // Equipment rental (8-10% of labor cost)
  const equipmentCost = laborCost * 0.10;
  
  breakdown.push({
    category: 'Equipment',
    item: 'Equipment Rental',
    quantity: 1,
    unit: 'lump_sum',
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
    breakdown
  };
}

/**
 * GET /api/cost-estimates
 * List all cost estimates for current user (optionally filter by projectId)
 */
router.get('/', auth, async (req, res) => {
  try {
    const { projectId, limit = 50, page = 1 } = req.query;
    const userId = req.user._id;

    const query = { createdBy: userId };
    if (projectId) {
      query.project = projectId;
    }

    const skip = (page - 1) * limit;
    
    const [estimates, total] = await Promise.all([
      CostEstimate.find(query)
        .populate('project', 'name')
        .populate('basedOnFloorPlan', 'name version')
        .populate('createdBy', 'username email')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      CostEstimate.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: estimates,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching cost estimates:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching cost estimates',
      error: error.message 
    });
  }
});

/**
 * GET /api/cost-estimates/:id
 * Get single cost estimate by ID
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const estimate = await CostEstimate.findById(req.params.id)
      .populate('project', 'name owner collaborators')
      .populate('basedOnFloorPlan')
      .populate('createdBy', 'username email');

    if (!estimate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cost estimate not found' 
      });
    }

    // Check access
    const userId = req.user._id;
    if (estimate.project) {
      const project = estimate.project;
      const isOwner = project.owner.toString() === userId.toString();
      const isCollaborator = project.collaborators.find(c => c.user.toString() === userId.toString()) !== undefined;
      const isCreator = estimate.createdBy._id.toString() === userId;

      if (!isOwner && !isCollaborator && !isCreator) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      }
    } else {
      if (estimate.createdBy._id.toString() !== userId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      }
    }

    res.json({
      success: true,
      data: estimate
    });
  } catch (error) {
    console.error('Error fetching cost estimate:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching cost estimate',
      error: error.message 
    });
  }
});

/**
 * POST /api/cost-estimates/calculate
 * Calculate and save new cost estimate
 */
router.post('/calculate', auth, async (req, res) => {
  try {
    const { projectId, floorPlanId, propertyDetails, name } = req.body;
    const userId = req.user._id;

    // Validate required data
    if (!propertyDetails && !projectId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Either propertyDetails or projectId is required' 
      });
    }

    let project = null;
    let floorPlan = null;
    let propDetails = propertyDetails;

    // If projectId provided, check access and fetch details
    if (projectId) {
      project = await Project.findById(projectId);
      
      if (!project) {
        return res.status(404).json({ 
          success: false, 
          message: 'Project not found' 
        });
      }

      const isOwner = project.owner.toString() === userId.toString();
      const collaborator = project.collaborators.find(c => c.user.toString() === userId.toString());
      const isCollaborator = collaborator && ['editor', 'admin'].includes(collaborator.role);

      if (!isOwner && !isCollaborator) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      }

      propDetails = project.propertyDetails;

      // Try to get floor plan
      if (floorPlanId) {
        floorPlan = await FloorPlan.findById(floorPlanId);
      } else if (project.activeFloorPlan) {
        floorPlan = await FloorPlan.findById(project.activeFloorPlan);
      }
    }

    // Calculate costs
    const costs = calculateCosts(propDetails, floorPlan);

    // Create cost estimate
    const estimate = new CostEstimate({
      project: projectId || null,
      name: name || `Cost Estimate - ${new Date().toLocaleDateString()}`,
      materials: costs.materials,
      labor: costs.labor,
      permits: costs.permits,
      equipment: costs.equipment,
      total: costs.total,
      currency: 'INR',
      breakdown: costs.breakdown,
      calculatedAt: new Date(),
      basedOnFloorPlan: floorPlan ? floorPlan._id : null,
      calculationMethod: 'automatic',
      calculationInputs: { propertyDetails: propDetails, floorPlanId },
      isActive: true,
      createdBy: userId
    });

    await estimate.save();

    // If linked to project, activate this estimate
    if (projectId) {
      await estimate.activate();
      
      // Emit Socket.IO event
      const io = req.app.get('io');
      if (io) {
        io.to(projectId).emit('cost-estimate-created', {
          projectId,
          costEstimate: estimate,
          createdBy: userId
        });
      }
    }

    res.json({
      success: true,
      message: 'Cost estimate calculated and saved successfully',
      data: estimate
    });
  } catch (error) {
    console.error('Error calculating cost estimate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate cost estimate',
      error: error.message
    });
  }
});

/**
 * PUT /api/cost-estimates/:id
 * Update cost estimate (for fine-tuning)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const estimate = await CostEstimate.findById(req.params.id).populate('project');

    if (!estimate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cost estimate not found' 
      });
    }

    // Check access
    const userId = req.user._id;
    if (estimate.project) {
      const project = estimate.project;
      const isOwner = project.owner.toString() === userId.toString();
      const collaborator = project.collaborators.find(c => c.user.toString() === userId.toString());
      const isCollaborator = collaborator && ['editor', 'admin'].includes(collaborator.role);

      if (!isOwner && !isCollaborator) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      }
    } else {
      if (estimate.createdBy.toString() !== userId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      }
    }

    // Update allowed fields
    const { name, materials, labor, permits, equipment, breakdown } = req.body;
    
    if (name !== undefined) estimate.name = name;
    if (materials !== undefined) estimate.materials = materials;
    if (labor !== undefined) estimate.labor = labor;
    if (permits !== undefined) estimate.permits = permits;
    if (equipment !== undefined) estimate.equipment = equipment;
    if (breakdown !== undefined) estimate.breakdown = breakdown;
    
    // Recalculate total
    estimate.total = (estimate.materials || 0) + (estimate.labor || 0) + 
                     (estimate.permits || 0) + (estimate.equipment || 0);
    
    estimate.calculationMethod = 'manual';
    
    await estimate.save();

    // Emit Socket.IO event
    if (estimate.project) {
      const io = req.app.get('io');
      if (io) {
        io.to(estimate.project.toString()).emit('cost-estimate-updated', {
          projectId: estimate.project,
          costEstimateId: estimate._id,
          changes: { materials, labor, permits, equipment, breakdown },
          updatedBy: userId
        });
      }
    }

    res.json({
      success: true,
      message: 'Cost estimate updated successfully',
      data: estimate
    });
  } catch (error) {
    console.error('Error updating cost estimate:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating cost estimate',
      error: error.message 
    });
  }
});

/**
 * DELETE /api/cost-estimates/:id
 * Delete cost estimate
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const estimate = await CostEstimate.findById(req.params.id).populate('project');

    if (!estimate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cost estimate not found' 
      });
    }

    // Check access
    const userId = req.user._id;
    if (estimate.project) {
      const project = estimate.project;
      const isOwner = project.owner.toString() === userId.toString();
      
      if (!isOwner) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Only project owner can delete cost estimates.' 
        });
      }

      // Prevent deletion of active estimate
      if (estimate.isActive) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete active cost estimate. Activate another estimate first.' 
        });
      }
    } else {
      if (estimate.createdBy.toString() !== userId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      }
    }

    await CostEstimate.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Cost estimate deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting cost estimate:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting cost estimate',
      error: error.message 
    });
  }
});

/**
 * POST /api/cost-estimates/:id/activate
 * Set cost estimate as active for its project
 */
router.post('/:id/activate', auth, async (req, res) => {
  try {
    const estimate = await CostEstimate.findById(req.params.id).populate('project');

    if (!estimate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cost estimate not found' 
      });
    }

    if (!estimate.project) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot activate standalone cost estimate' 
      });
    }

    // Check access
    const userId = req.user._id;
    const project = estimate.project;
    const isOwner = project.owner.toString() === userId.toString();
    const collaborator = project.collaborators.find(c => c.user.toString() === userId.toString());
    const isCollaborator = collaborator && ['editor', 'admin'].includes(collaborator.role);

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    await estimate.activate();

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to(estimate.project.toString()).emit('cost-estimate-activated', {
        projectId: estimate.project,
        costEstimateId: estimate._id,
        activatedBy: userId
      });
    }

    res.json({
      success: true,
      message: 'Cost estimate activated successfully',
      data: estimate
    });
  } catch (error) {
    console.error('Error activating cost estimate:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error activating cost estimate',
      error: error.message 
    });
  }
});

module.exports = router;
