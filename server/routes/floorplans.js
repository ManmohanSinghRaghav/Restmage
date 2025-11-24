const express = require('express');
const { auth } = require('../middleware/auth');
const { checkProjectAccess, requireEditAccess } = require('../middleware/checkProjectAccess');
const FloorPlan = require('../models/FloorPlan');
const { generateFloorPlan: generateFloorPlanAI } = require('../services/geminiFloorPlan');

const router = express.Router();

/**
 * GET /api/floorplans
 * List all floor plans for current user (optionally filter by projectId)
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
    
    const [floorPlans, total] = await Promise.all([
      FloorPlan.find(query)
        .populate('project', 'name')
        .populate('createdBy', 'username email')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      FloorPlan.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: floorPlans,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching floor plans:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching floor plans',
      error: error.message 
    });
  }
});

/**
 * GET /api/floorplans/:id
 * Get single floor plan by ID
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const floorPlan = await FloorPlan.findById(req.params.id)
      .populate('project', 'name owner collaborators')
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email');

    if (!floorPlan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Floor plan not found' 
      });
    }

    // Check access if floor plan is linked to a project
    if (floorPlan.project) {
      const project = floorPlan.project;
      const userId = req.user._id;
      const isOwner = project.owner.toString() === userId.toString();
      const collaborator = project.collaborators.find(c => c.user.toString() === userId.toString());
      const isCollaborator = collaborator !== undefined;
      const isCreator = floorPlan.createdBy._id.toString() === userId;

      if (!isOwner && !isCollaborator && !isCreator) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      }
    } else {
      // Standalone floor plan - only creator can access
      if (floorPlan.createdBy._id.toString() !== req.user._id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      }
    }

    res.json({
      success: true,
      data: floorPlan
    });
  } catch (error) {
    console.error('Error fetching floor plan:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching floor plan',
      error: error.message 
    });
  }
});

/**
 * POST /api/floorplans/generate-ai
 * Generate floor plan using AI (replaces old /api/floorplan/generate-ai)
 */
router.post('/generate-ai', auth, async (req, res) => {
  try {
    const { inputs, projectId, name } = req.body;
    const userId = req.user._id;

    console.log('Generate floor plan request:', {
      userId: userId.toString(),
      projectId,
      hasInputs: !!inputs
    });

    // Validate inputs
    if (!inputs) {
      return res.status(400).json({ 
        success: false, 
        message: 'Floor plan inputs are required' 
      });
    }

    // If projectId provided, check access
    if (projectId) {
      req.body.project = projectId;
      req.params.projectId = projectId;
      
      // Check project access using middleware logic
      const Project = require('../models/Project');
      const project = await Project.findById(projectId);
      
      if (!project) {
        return res.status(404).json({ 
          success: false, 
          message: 'Project not found' 
        });
      }

      const isOwner = project.owner.toString() === userId.toString().toString();
      const collaborator = project.collaborators.find(
        c => c.user.toString() === userId.toString().toString()
      );
      const isCollaborator = collaborator && ['editor', 'admin'].includes(collaborator.role);

      console.log('Access check:', {
        projectOwner: project.owner.toString(),
        userId: userId.toString(),
        isOwner,
        collaboratorsCount: project.collaborators.length,
        isCollaborator
      });

      if (!isOwner && !isCollaborator) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. You do not have permission to create floor plans for this project.' 
        });
      }
    }

    console.log('Generating AI floor plan with inputs:', inputs);

    // Generate floor plan using AI service
    const floorPlanData = await generateFloorPlanAI(inputs);

    // Save to database
    const floorPlan = new FloorPlan({
      project: projectId || null,
      name: name || floorPlanData.map_info?.title || 'AI Generated Floor Plan',
      mapInfo: floorPlanData.map_info,
      plotSummary: floorPlanData.plot_summary,
      rooms: floorPlanData.rooms,
      walls: floorPlanData.walls,
      doors: floorPlanData.doors,
      windows: floorPlanData.windows,
      stairs: floorPlanData.stairs,
      fixtures: floorPlanData.fixtures,
      generatedBy: 'ai',
      generationInputs: inputs,
      isActive: true,
      createdBy: userId,
      updatedBy: userId
    });

    await floorPlan.save();

    // If linked to project, activate this floor plan
    if (projectId) {
      await floorPlan.activate();
      
      // Emit Socket.IO event
      const io = req.app.get('io');
      if (io) {
        io.to(projectId).emit('floorplan-created', {
          projectId,
          floorPlan,
          createdBy: userId
        });
      }
    }

    res.json({
      success: true,
      message: 'AI floor plan generated and saved successfully',
      data: floorPlan
    });
  } catch (error) {
    console.error('AI floor plan generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI floor plan',
      error: error.message
    });
  }
});

/**
 * PUT /api/floorplans/:id
 * Update floor plan (with optimistic locking)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const floorPlan = await FloorPlan.findById(req.params.id).populate('project');

    if (!floorPlan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Floor plan not found' 
      });
    }

    // Check access
    const userId = req.user._id;
    if (floorPlan.project) {
      const project = floorPlan.project;
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
      if (floorPlan.createdBy.toString() !== userId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      }
    }

    // Optimistic locking check
    const { version, overrideVersion, ...updateData } = req.body;
    
    if (version && floorPlan.version !== version && !overrideVersion) {
      return res.status(409).json({
        success: false,
        message: 'Version conflict. Floor plan was updated by another user.',
        currentVersion: floorPlan.version,
        yourVersion: version,
        requiresOverride: true
      });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'rooms', 'walls', 'doors', 'windows', 'stairs', 'fixtures', 'mapInfo', 'plotSummary'];
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        floorPlan[field] = updateData[field];
      }
    });

    floorPlan.updatedBy = userId;
    floorPlan.version += 1;
    
    await floorPlan.save();

    // Emit Socket.IO event
    if (floorPlan.project) {
      const io = req.app.get('io');
      if (io) {
        io.to(floorPlan.project.toString()).emit('floorplan-updated', {
          projectId: floorPlan.project,
          floorPlanId: floorPlan._id,
          changes: updateData,
          updatedBy: userId
        });
      }
    }

    res.json({
      success: true,
      message: 'Floor plan updated successfully',
      data: floorPlan
    });
  } catch (error) {
    console.error('Error updating floor plan:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating floor plan',
      error: error.message 
    });
  }
});

/**
 * DELETE /api/floorplans/:id
 * Delete floor plan
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const floorPlan = await FloorPlan.findById(req.params.id).populate('project');

    if (!floorPlan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Floor plan not found' 
      });
    }

    // Check access
    const userId = req.user._id;
    if (floorPlan.project) {
      const project = floorPlan.project;
      const isOwner = project.owner.toString() === userId.toString();
      
      if (!isOwner) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Only project owner can delete floor plans.' 
        });
      }

      // Prevent deletion of active floor plan
      if (floorPlan.isActive) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete active floor plan. Activate another floor plan first.' 
        });
      }
    } else {
      if (floorPlan.createdBy.toString() !== userId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      }
    }

    await FloorPlan.findByIdAndDelete(req.params.id);

    // Emit Socket.IO event
    if (floorPlan.project) {
      const io = req.app.get('io');
      if (io) {
        io.to(floorPlan.project.toString()).emit('floorplan-deleted', {
          projectId: floorPlan.project,
          floorPlanId: floorPlan._id,
          deletedBy: userId
        });
      }
    }

    res.json({
      success: true,
      message: 'Floor plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting floor plan:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting floor plan',
      error: error.message 
    });
  }
});

/**
 * POST /api/floorplans/:id/activate
 * Set floor plan as active for its project
 */
router.post('/:id/activate', auth, async (req, res) => {
  try {
    const floorPlan = await FloorPlan.findById(req.params.id).populate('project');

    if (!floorPlan) {
      return res.status(404).json({ 
        success: false, 
        message: 'Floor plan not found' 
      });
    }

    if (!floorPlan.project) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot activate standalone floor plan' 
      });
    }

    // Check access
    const userId = req.user._id;
    const project = floorPlan.project;
    const isOwner = project.owner.toString() === userId.toString();
    const collaborator = project.collaborators.find(c => c.user.toString() === userId.toString());
    const isCollaborator = collaborator && ['editor', 'admin'].includes(collaborator.role);

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    await floorPlan.activate();

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to(floorPlan.project.toString()).emit('floorplan-activated', {
        projectId: floorPlan.project,
        floorPlanId: floorPlan._id,
        activatedBy: userId
      });
    }

    res.json({
      success: true,
      message: 'Floor plan activated successfully',
      data: floorPlan
    });
  } catch (error) {
    console.error('Error activating floor plan:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error activating floor plan',
      error: error.message 
    });
  }
});

module.exports = router;
