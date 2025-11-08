const express = require('express');
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validateObjectId');

const router = express.Router();

console.log('maps routes module loaded');

// Get map data for a project
router.get('/:projectId', auth, validateObjectId('projectId'), async (req, res) => {
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
      mapData: project.mapData,
      propertyDetails: project.propertyDetails
    });
  } catch (error) {
    console.error('Get map data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add or update map layer
router.post('/:projectId/layers', auth, validateObjectId('projectId'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

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

    const { layer } = req.body;
    
    if (!layer || !layer.id) {
      return res.status(400).json({ message: 'Layer data with ID is required' });
    }

    // Check if layer already exists
    const existingLayerIndex = project.mapData.layers.findIndex(l => l.id === layer.id);
    
    if (existingLayerIndex !== -1) {
      // Update existing layer
      project.mapData.layers[existingLayerIndex] = layer;
    } else {
      // Add new layer
      project.mapData.layers.push(layer);
    }

    await project.save();

    // Emit real-time update via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.projectId).emit('layer-updated', {
        projectId: req.params.projectId,
        layer,
        action: existingLayerIndex !== -1 ? 'updated' : 'added',
        updatedBy: req.user._id
      });
    }

    res.json({
      message: `Layer ${existingLayerIndex !== -1 ? 'updated' : 'added'} successfully`,
      layer
    });
  } catch (error) {
    console.error('Add/update layer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete map layer
router.delete('/:projectId/layers/:layerId', auth, validateObjectId('projectId'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

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

    const { layerId } = req.params;
    
    // Find and remove layer
    const layerIndex = project.mapData.layers.findIndex(l => l.id === layerId);
    
    if (layerIndex === -1) {
      return res.status(404).json({ message: 'Layer not found' });
    }

    const deletedLayer = project.mapData.layers[layerIndex];
    project.mapData.layers.splice(layerIndex, 1);
    
    await project.save();

    // Emit real-time update via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.projectId).emit('layer-deleted', {
        projectId: req.params.projectId,
        layerId,
        updatedBy: req.user._id
      });
    }

    res.json({
      message: 'Layer deleted successfully',
      deletedLayer
    });
  } catch (error) {
    console.error('Delete layer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update map center and zoom
router.put('/:projectId/view', auth, validateObjectId('projectId'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

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

    const { center, zoom, bounds } = req.body;
    
    if (center) {
      project.mapData.center = center;
    }
    
    if (zoom !== undefined) {
      project.mapData.zoom = zoom;
    }
    
    if (bounds) {
      project.mapData.bounds = bounds;
    }

    await project.save();

    // Emit real-time update via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.projectId).emit('view-updated', {
        projectId: req.params.projectId,
        center: project.mapData.center,
        zoom: project.mapData.zoom,
        bounds: project.mapData.bounds,
        updatedBy: req.user._id
      });
    }

    res.json({
      message: 'Map view updated successfully',
      mapView: {
        center: project.mapData.center,
        zoom: project.mapData.zoom,
        bounds: project.mapData.bounds
      }
    });
  } catch (error) {
    console.error('Update map view error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save a standalone layout (coordinates + area)
// This endpoint is a lightweight handler for UI "Save Layout" actions when not tied to a project.
// It requires authentication and currently stores the submitted layout on the user's account under `savedLayouts`.
// If you prefer a different behavior (save to a project or create a new project), we can adapt this.
router.post('/save-layout', auth, async (req, res) => {
  try {
    console.log('POST /api/maps/save-layout called by user', req.user?._id);
    const User = require('../models/User');
    const { coordinates, area, name } = req.body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
      return res.status(400).json({ message: 'Coordinates are required' });
    }

    // Attach layout to the authenticated user as a saved layout (create array if missing)
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.savedLayouts) user.savedLayouts = [];

    const layout = {
      id: new Date().getTime().toString(),
      name: name || `Layout ${new Date().toISOString()}`,
      coordinates,
      area,
      createdAt: new Date()
    };

    user.savedLayouts.push(layout);
    await user.save();

    res.json({ message: 'Layout saved successfully', layout });
  } catch (error) {
    console.error('Save layout error:', error);
    res.status(500).json({ message: 'Server error while saving layout' });
  }
});

// Toggle layer visibility
router.put('/:projectId/layers/:layerId/visibility', auth, validateObjectId('projectId'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

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

    const { layerId } = req.params;
    const { visible } = req.body;
    
    // Find and update layer visibility
    const layerIndex = project.mapData.layers.findIndex(l => l.id === layerId);
    
    if (layerIndex === -1) {
      return res.status(404).json({ message: 'Layer not found' });
    }

    project.mapData.layers[layerIndex].visible = visible;
    await project.save();

    // Emit real-time update via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.projectId).emit('layer-visibility-changed', {
        projectId: req.params.projectId,
        layerId,
        visible,
        updatedBy: req.user._id
      });
    }

    res.json({
      message: 'Layer visibility updated successfully',
      layer: project.mapData.layers[layerIndex]
    });
  } catch (error) {
    console.error('Update layer visibility error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;