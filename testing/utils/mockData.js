/**
 * Mock Data Generators for Testing
 * Provides consistent test data for backend and frontend tests
 */

/**
 * Generate mock project data
 * @param {Object} overrides - Optional field overrides
 * @returns {Object} Mock project data
 */
function generateMockProject(overrides = {}) {
  return {
    name: 'Test Real Estate Project',
    description: 'A test project for automated testing',
    location: 'Test City, Test Country',
    status: 'planning',
    mapData: {
      center: { lat: 40.7128, lng: -74.0060 },
      zoom: 13,
      bounds: {
        north: 40.7228,
        south: 40.7028,
        east: -73.9960,
        west: -74.0160
      }
    },
    propertyDetails: {
      address: '123 Test Street',
      propertyType: 'residential',
      totalArea: 5000,
      floors: 2,
      units: 4
    },
    ...overrides
  };
}

/**
 * Generate mock floor plan data
 * @param {string} projectId - Associated project ID
 * @param {Object} overrides - Optional field overrides
 * @returns {Object} Mock floor plan data
 */
function generateMockFloorPlan(projectId, overrides = {}) {
  return {
    projectId: projectId,
    name: 'Test Floor Plan',
    description: 'Automatically generated test floor plan',
    dimensions: {
      width: 40,
      height: 30,
      unit: 'feet'
    },
    rooms: [
      {
        id: 'room1',
        type: 'Living Room',
        dimensions: { width: 15, height: 20, unit: 'feet' },
        position: { x: 0, y: 0 },
        features: ['window', 'door']
      },
      {
        id: 'room2',
        type: 'Bedroom',
        dimensions: { width: 12, height: 15, unit: 'feet' },
        position: { x: 15, y: 0 },
        features: ['window', 'closet']
      },
      {
        id: 'room3',
        type: 'Kitchen',
        dimensions: { width: 10, height: 12, unit: 'feet' },
        position: { x: 0, y: 20 },
        features: ['sink', 'stove', 'refrigerator']
      },
      {
        id: 'room4',
        type: 'Bathroom',
        dimensions: { width: 8, height: 8, unit: 'feet' },
        position: { x: 27, y: 0 },
        features: ['toilet', 'shower', 'sink']
      }
    ],
    totalArea: 1200,
    ...overrides
  };
}

/**
 * Generate mock AI floor plan generation parameters
 * @param {Object} overrides - Optional field overrides
 * @returns {Object} Mock floor plan generation parameters
 */
function generateMockFloorPlanParams(overrides = {}) {
  return {
    propertyType: 'residential',
    totalArea: 1500,
    floors: 1,
    bedrooms: 3,
    bathrooms: 2,
    preferences: 'Open floor plan with large living room',
    style: 'modern',
    ...overrides
  };
}

/**
 * Generate mock cost estimate data
 * @param {string} projectId - Associated project ID
 * @param {Object} overrides - Optional field overrides
 * @returns {Object} Mock cost estimate data
 */
function generateMockCostEstimate(projectId, overrides = {}) {
  return {
    projectId: projectId,
    type: 'construction',
    items: [
      {
        category: 'Foundation',
        description: 'Concrete foundation',
        quantity: 1200,
        unit: 'sq ft',
        unitCost: 15,
        totalCost: 18000
      },
      {
        category: 'Framing',
        description: 'Wood framing',
        quantity: 1200,
        unit: 'sq ft',
        unitCost: 25,
        totalCost: 30000
      },
      {
        category: 'Roofing',
        description: 'Asphalt shingles',
        quantity: 1300,
        unit: 'sq ft',
        unitCost: 8,
        totalCost: 10400
      },
      {
        category: 'Electrical',
        description: 'Electrical wiring and fixtures',
        quantity: 1,
        unit: 'project',
        unitCost: 12000,
        totalCost: 12000
      },
      {
        category: 'Plumbing',
        description: 'Plumbing installation',
        quantity: 1,
        unit: 'project',
        unitCost: 10000,
        totalCost: 10000
      }
    ],
    subtotal: 80400,
    tax: 6432,
    contingency: 8040,
    totalCost: 94872,
    ...overrides
  };
}

/**
 * Generate mock user data
 * @param {Object} overrides - Optional field overrides
 * @returns {Object} Mock user data
 */
function generateMockUser(overrides = {}) {
  const randomId = Math.floor(Math.random() * 10000);
  return {
    username: `testuser${randomId}`,
    email: `testuser${randomId}@test.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    ...overrides
  };
}

/**
 * Generate mock chatbot message
 * @param {string} message - User message
 * @param {Object} overrides - Optional field overrides
 * @returns {Object} Mock chatbot message
 */
function generateMockChatMessage(message = 'What are the best materials for construction?', overrides = {}) {
  return {
    message: message,
    context: {
      projectType: 'residential',
      location: 'urban'
    },
    ...overrides
  };
}

/**
 * Generate mock price prediction parameters
 * @param {Object} overrides - Optional field overrides
 * @returns {Object} Mock price prediction parameters
 */
function generateMockPricePrediction(overrides = {}) {
  return {
    propertyType: 'residential',
    location: 'New York, NY',
    area: 2000,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2020,
    condition: 'excellent',
    amenities: ['parking', 'gym', 'pool'],
    ...overrides
  };
}

/**
 * Generate mock map layer data
 * @param {string} projectId - Associated project ID
 * @param {Object} overrides - Optional field overrides
 * @returns {Object} Mock map layer data
 */
function generateMockMapLayer(projectId, overrides = {}) {
  return {
    projectId: projectId,
    name: 'Test Layer',
    type: 'polygon',
    data: {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-74.0060, 40.7128],
          [-74.0050, 40.7128],
          [-74.0050, 40.7138],
          [-74.0060, 40.7138],
          [-74.0060, 40.7128]
        ]]
      },
      properties: {
        name: 'Test Property Boundary',
        color: '#FF5733'
      }
    },
    visible: true,
    ...overrides
  };
}

module.exports = {
  generateMockProject,
  generateMockFloorPlan,
  generateMockFloorPlanParams,
  generateMockCostEstimate,
  generateMockUser,
  generateMockChatMessage,
  generateMockPricePrediction,
  generateMockMapLayer
};
