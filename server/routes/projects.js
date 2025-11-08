const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validateObjectId');

const router = express.Router();

// Get all projects for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status;

    const query = {
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id }
      ]
    };

    if (search) {
      query.$text = { $search: search };
    }

    if (status) {
      query.status = status;
    }

    const projects = await Project.find(query)
      .populate('owner', 'username email')
      .populate('collaborators.user', 'username email')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Project.countDocuments(query);

    res.json({
      projects,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single project
router.get('/:id', auth, validateObjectId(), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('collaborators.user', 'username email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to the project
    const hasAccess = project.owner._id.toString() === req.user._id.toString() ||
      project.collaborators.some(collab => collab.user._id.toString() === req.user._id.toString()) ||
      project.isPublic;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new project
router.post('/', auth, [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Project name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('propertyDetails.type')
    .isIn(['residential', 'commercial', 'industrial', 'mixed-use'])
    .withMessage('Invalid property type'),
  body('propertyDetails.dimensions.length')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Length must be a positive number'),
  body('propertyDetails.dimensions.width')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Width must be a positive number'),
  body('propertyDetails.dimensions.height')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Height must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const projectData = {
      ...req.body,
      owner: req.user._id
    };

    const project = new Project(projectData);
    await project.save();

    await project.populate('owner', 'username email');

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error during project creation' });
  }
});

// Update project
router.put('/:id', auth, validateObjectId(), [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Project name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has edit access
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isEditor = project.collaborators.some(collab => 
      collab.user.toString() === req.user._id.toString() && 
      ['editor', 'admin'].includes(collab.role)
    );

    if (!isOwner && !isEditor) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Update project
    Object.keys(req.body).forEach(key => {
      if (key !== 'owner' && key !== 'collaborators') {
        project[key] = req.body[key];
      }
    });

    await project.save();
    await project.populate('owner', 'username email');
    await project.populate('collaborators.user', 'username email');

    res.json({
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error during project update' });
  }
});

// Update map data
router.put('/:id/map', auth, validateObjectId(), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has edit access
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isEditor = project.collaborators.some(collab => 
      collab.user.toString() === req.user._id.toString() && 
      ['editor', 'admin'].includes(collab.role)
    );

    if (!isOwner && !isEditor) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    project.mapData = { ...project.mapData, ...req.body };
    await project.save();

    // Emit real-time update via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.id).emit('map-updated', {
        projectId: req.params.id,
        mapData: project.mapData,
        updatedBy: req.user._id
      });
    }

    res.json({
      message: 'Map updated successfully',
      mapData: project.mapData
    });
  } catch (error) {
    console.error('Update map error:', error);
    res.status(500).json({ message: 'Server error during map update' });
  }
});

// Add collaborator
router.post('/:id/collaborators', auth, validateObjectId(), [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('role').isIn(['viewer', 'editor', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, role } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only owner can add collaborators
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only project owner can add collaborators' });
    }

    // Find user by email
    const User = require('../models/User');
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already a collaborator
    const existingCollaborator = project.collaborators.find(
      collab => collab.user.toString() === user._id.toString()
    );

    if (existingCollaborator) {
      return res.status(400).json({ message: 'User is already a collaborator' });
    }

    project.collaborators.push({ user: user._id, role });
    await project.save();
    await project.populate('collaborators.user', 'username email');

    res.json({
      message: 'Collaborator added successfully',
      collaborators: project.collaborators
    });
  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete project
router.delete('/:id', auth, validateObjectId(), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only owner can delete project
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only project owner can delete the project' });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;