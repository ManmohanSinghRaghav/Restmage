const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validateObjectId');
const {
  getProjects, getProject, createProject, updateProject,
  updateMapData, addCollaborator, deleteProject
} = require('../controllers/projectsController');

const router = express.Router();

router.get('/', auth, getProjects);
router.get('/:id', auth, validateObjectId(), getProject);

router.post('/', auth, [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Project name must be 1-100 chars'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description max 500 chars'),
  body('propertyDetails.type').isIn(['residential', 'commercial', 'industrial', 'mixed-use']),
  body('propertyDetails.dimensions.length').isFloat({ min: 0 }),
  body('propertyDetails.dimensions.width').isFloat({ min: 0 }),
  body('propertyDetails.dimensions.height').isFloat({ min: 0 })
], createProject);

router.put('/:id', auth, validateObjectId(), [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().isLength({ max: 500 })
], updateProject);

router.put('/:id/map', auth, validateObjectId(), updateMapData);

router.post('/:id/collaborators', auth, validateObjectId(), [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('role').isIn(['viewer', 'editor', 'admin']).withMessage('Invalid role')
], addCollaborator);

router.delete('/:id', auth, validateObjectId(), deleteProject);

module.exports = router;