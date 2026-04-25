const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const User = require('../models/User');

const checkEditAccess = (project, userId) => {
  const isOwner = project.owner.toString() === userId.toString();
  const isEditor = project.collaborators.some(
    c => c.user.toString() === userId.toString() && ['editor', 'admin'].includes(c.role)
  );
  return isOwner || isEditor;
};

const checkReadAccess = (project, userId) =>
  project.owner.toString() === userId.toString() ||
  project.collaborators.some(c => c.user.toString() === userId.toString()) ||
  project.isPublic;

// GET /api/projects
const getProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status;

    const query = { $or: [{ owner: req.user._id }, { 'collaborators.user': req.user._id }] };
    if (search) query.$text = { $search: search };
    if (status) query.status = status;

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('owner', 'username email')
        .populate('collaborators.user', 'username email')
        .sort({ updatedAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      Project.countDocuments(query)
    ]);

    res.json({ projects, totalPages: Math.ceil(total / limit), currentPage: page, total });
  } catch (err) {
    console.error('getProjects:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/projects/:id
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('collaborators.user', 'username email');

    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!checkReadAccess(project, req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (err) {
    console.error('getProject:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/projects
const createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const project = await new Project({ ...req.body, owner: req.user._id }).save();
    await project.populate('owner', 'username email');
    res.status(201).json({ message: 'Project created successfully', project });
  } catch (err) {
    console.error('createProject:', err.message);
    res.status(500).json({ message: 'Server error during project creation' });
  }
};

// PUT /api/projects/:id
const updateProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!checkEditAccess(project, req.user._id)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    Object.keys(req.body).forEach(key => {
      if (key !== 'owner' && key !== 'collaborators') project[key] = req.body[key];
    });

    await project.save();
    await project.populate('owner', 'username email');
    await project.populate('collaborators.user', 'username email');

    res.json({ message: 'Project updated successfully', project });
  } catch (err) {
    console.error('updateProject:', err.message);
    res.status(500).json({ message: 'Server error during project update' });
  }
};

// PUT /api/projects/:id/map
const updateMapData = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!checkEditAccess(project, req.user._id)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    project.mapData = { ...project.mapData, ...req.body };
    await project.save();

    const io = req.app.get('io');
    if (io) {
      io.to(req.params.id).emit('map-updated', {
        projectId: req.params.id,
        mapData: project.mapData,
        updatedBy: req.user._id
      });
    }

    res.json({ message: 'Map updated successfully', mapData: project.mapData });
  } catch (err) {
    console.error('updateMapData:', err.message);
    res.status(500).json({ message: 'Server error during map update' });
  }
};

// POST /api/projects/:id/collaborators
const addCollaborator = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, role } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only project owner can add collaborators' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const alreadyCollab = project.collaborators.some(
      c => c.user.toString() === user._id.toString()
    );
    if (alreadyCollab) return res.status(400).json({ message: 'User is already a collaborator' });

    project.collaborators.push({ user: user._id, role });
    await project.save();
    await project.populate('collaborators.user', 'username email');

    res.json({ message: 'Collaborator added successfully', collaborators: project.collaborators });
  } catch (err) {
    console.error('addCollaborator:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/projects/:id
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only project owner can delete the project' });
    }

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('deleteProject:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProjects, getProject, createProject, updateProject,
  updateMapData, addCollaborator, deleteProject
};
