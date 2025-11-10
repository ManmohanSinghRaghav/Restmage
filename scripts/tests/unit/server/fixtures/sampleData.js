/**
 * Test Fixtures
 * Sample data for testing
 */

const sampleUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

const sampleProject = {
  name: 'Test Floor Plan',
  description: 'A test project for unit testing',
  plotDimensions: {
    length: 50,
    width: 40
  },
  rooms: [
    {
      id: 'room-1',
      type: 'bedroom',
      name: 'Master Bedroom',
      x: 5,
      y: 5,
      width: 15,
      height: 12,
      color: '#E3F2FD'
    },
    {
      id: 'room-2',
      type: 'bathroom',
      name: 'Master Bath',
      x: 20,
      y: 5,
      width: 8,
      height: 8,
      color: '#F3E5F5'
    }
  ],
  status: 'draft'
};

const sampleFloorPlanRequirements = {
  plotLength: 50,
  plotWidth: 40,
  floors: 2,
  bedrooms: 3,
  bathrooms: 2,
  kitchen: true,
  livingRoom: true,
  diningRoom: true,
  garage: false
};

const samplePricePrediction = {
  area: 2000,
  bedrooms: 3,
  bathrooms: 2,
  floors: 2,
  yearBuilt: 2020,
  location: 'urban',
  condition: 'excellent',
  garage: 'Yes',
  amenities: ['garden', 'balcony']
};

const sampleGeminiResponse = {
  plotDimensions: {
    length: 50,
    width: 40
  },
  rooms: [
    {
      id: 'gemini-room-1',
      type: 'bedroom',
      name: 'Bedroom 1',
      x: 5,
      y: 5,
      width: 12,
      height: 10,
      color: '#E3F2FD'
    }
  ],
  walls: [
    {
      id: 'wall-1',
      x1: 0,
      y1: 0,
      x2: 50,
      y2: 0,
      thickness: 0.2
    }
  ],
  doors: [],
  windows: []
};

module.exports = {
  sampleUser,
  sampleProject,
  sampleFloorPlanRequirements,
  samplePricePrediction,
  sampleGeminiResponse
};
