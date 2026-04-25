const Project = require('../models/Project');

const MATERIAL_PRICES = {
  concrete: { pricePerUnit: 150, unit: 'cubic_yard' },
  steel: { pricePerUnit: 0.65, unit: 'pound' },
  brick: { pricePerUnit: 0.35, unit: 'piece' },
  wood: { pricePerUnit: 4.50, unit: 'board_foot' },
  drywall: { pricePerUnit: 1.20, unit: 'square_foot' },
  flooring: { pricePerUnit: 8.50, unit: 'square_foot' },
  roofing: { pricePerUnit: 12.00, unit: 'square_foot' },
  paint: { pricePerUnit: 35.00, unit: 'gallon' },
  insulation: { pricePerUnit: 1.50, unit: 'square_foot' },
  plumbing: { pricePerUnit: 5.00, unit: 'linear_foot' },
  electrical: { pricePerUnit: 8.00, unit: 'linear_foot' },
  windows: { pricePerUnit: 450.00, unit: 'piece' },
  doors: { pricePerUnit: 350.00, unit: 'piece' }
};

const LABOR_RATES = { residential: 35, commercial: 45, industrial: 55, 'mixed-use': 50 };

function calculateCosts(propertyDetails) {
  const { dimensions, type, materials = [] } = propertyDetails;
  const sqft = dimensions.length * dimensions.width;

  let materialsCost = 0;
  const breakdown = [];

  materials.forEach(mat => {
    const info = MATERIAL_PRICES[mat.type?.toLowerCase()] || { pricePerUnit: mat.pricePerUnit || 0 };
    const cost = mat.quantity * info.pricePerUnit;
    materialsCost += cost;
    breakdown.push({ category: 'Materials', item: mat.type, quantity: mat.quantity, unitCost: info.pricePerUnit, totalCost: cost });
  });

  const laborCost = sqft * (LABOR_RATES[type] || 40);
  breakdown.push({ category: 'Labor', item: 'Construction Labor', quantity: sqft, unitCost: LABOR_RATES[type] || 40, totalCost: laborCost });

  const permitsCost = (materialsCost + laborCost) * 0.04;
  breakdown.push({ category: 'Permits', item: 'Building Permits & Fees', quantity: 1, unitCost: permitsCost, totalCost: permitsCost });

  const equipmentCost = laborCost * 0.10;
  breakdown.push({ category: 'Equipment', item: 'Equipment Rental', quantity: 1, unitCost: equipmentCost, totalCost: equipmentCost });

  return {
    materials: Math.round(materialsCost),
    labor: Math.round(laborCost),
    permits: Math.round(permitsCost),
    equipment: Math.round(equipmentCost),
    total: Math.round(materialsCost + laborCost + permitsCost + equipmentCost),
    breakdown,
    lastCalculated: new Date()
  };
}

// GET /api/cost/materials
const getMaterials = (req, res) => {
  res.json({ materials: MATERIAL_PRICES, lastUpdated: new Date() });
};

// POST /api/cost/:projectId/calculate
const calculateProjectCost = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const hasAccess =
      project.owner.toString() === req.user._id.toString() ||
      project.collaborators.some(c => c.user.toString() === req.user._id.toString()) ||
      project.isPublic;
    if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

    const costEstimation = calculateCosts(project.propertyDetails);
    project.costEstimation = costEstimation;
    await project.save();

    const io = req.app.get('io');
    if (io) io.to(req.params.projectId).emit('cost-updated', { projectId: req.params.projectId, costEstimation });

    res.json({ message: 'Cost calculated successfully', costEstimation });
  } catch (err) {
    console.error('calculateProjectCost:', err.message);
    res.status(500).json({ message: 'Server error during cost calculation' });
  }
};

// GET /api/cost/:projectId
const getCostEstimation = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const hasAccess =
      project.owner.toString() === req.user._id.toString() ||
      project.collaborators.some(c => c.user.toString() === req.user._id.toString()) ||
      project.isPublic;
    if (!hasAccess) return res.status(403).json({ message: 'Access denied' });

    res.json({ costEstimation: project.costEstimation || {}, propertyDetails: project.propertyDetails });
  } catch (err) {
    console.error('getCostEstimation:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/cost/market/:zipCode
const getMarketData = (req, res) => {
  const { zipCode } = req.params;
  res.json({
    zipCode,
    averageHomeValue: Math.floor(Math.random() * 500000) + 200000,
    pricePerSquareFoot: Math.floor(Math.random() * 200) + 100,
    marketTrend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)],
    lastUpdated: new Date()
  });
};

module.exports = { getMaterials, calculateProjectCost, getCostEstimation, getMarketData };
