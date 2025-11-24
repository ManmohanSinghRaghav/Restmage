const Project = require('../models/Project');

/**
 * Middleware to check if user has access to a project
 * Attaches project and permissions to request object
 */
const checkProjectAccess = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.project || req.query.projectId;
    
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const userId = req.user.userId;
    
    // Check if user is owner
    const isOwner = project.owner.toString() === userId;
    
    // Check if user is collaborator
    const collaborator = project.collaborators.find(
      c => c.user.toString() === userId
    );
    
    // Check if project is public
    const isPublic = project.isPublic;
    
    // Determine permissions
    const canView = isOwner || collaborator || isPublic;
    const canEdit = isOwner || (collaborator && ['editor', 'admin'].includes(collaborator.role));
    const canDelete = isOwner || (collaborator && collaborator.role === 'admin');
    
    if (!canView) {
      return res.status(403).json({ 
        message: 'Access denied. You do not have permission to view this project.' 
      });
    }

    // Attach project and permissions to request
    req.project = project;
    req.projectPermissions = {
      canView,
      canEdit,
      canDelete,
      isOwner,
      role: isOwner ? 'owner' : (collaborator ? collaborator.role : 'viewer')
    };

    next();
  } catch (error) {
    console.error('Error checking project access:', error);
    res.status(500).json({ message: 'Error checking project access' });
  }
};

/**
 * Middleware variant that requires edit permission
 */
const requireEditAccess = async (req, res, next) => {
  await checkProjectAccess(req, res, () => {
    if (!req.projectPermissions.canEdit) {
      return res.status(403).json({ 
        message: 'Access denied. You do not have permission to edit this project.' 
      });
    }
    next();
  });
};

/**
 * Middleware variant that requires delete permission
 */
const requireDeleteAccess = async (req, res, next) => {
  await checkProjectAccess(req, res, () => {
    if (!req.projectPermissions.canDelete) {
      return res.status(403).json({ 
        message: 'Access denied. You do not have permission to delete this project.' 
      });
    }
    next();
  });
};

module.exports = {
  checkProjectAccess,
  requireEditAccess,
  requireDeleteAccess
};
