const express = require('express');
const { auth } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validateObjectId');
const {
  getMaterials, calculateProjectCost, getCostEstimation, getMarketData
} = require('../controllers/costController');

const router = express.Router();

router.get('/materials', auth, getMaterials);
router.get('/market/:zipCode', auth, getMarketData);
router.post('/:projectId/calculate', auth, validateObjectId('projectId'), calculateProjectCost);
router.get('/:projectId', auth, validateObjectId('projectId'), getCostEstimation);

module.exports = router;