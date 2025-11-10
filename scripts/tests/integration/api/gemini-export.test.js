const request = require('supertest');
const express = require('express');
const geminiRoutes = require('../../../../server/routes/gemini');
const auth = require('../../../../server/middleware/auth');

// Mock auth middleware
jest.mock('../../../../server/middleware/auth', () => (req, res, next) => {
  req.user = { id: 'test-user-id' };
  next();
});

const app = express();
app.use(express.json());
app.use('/api/gemini', geminiRoutes);

describe('Gemini API Integration Tests', () => {
  describe('POST /api/gemini/generate-map', () => {
    it('should return 400 if requirements are missing', async () => {
      const response = await request(app)
        .post('/api/gemini/generate-map')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should generate fallback map when Gemini API key is not configured', async () => {
      const response = await request(app)
        .post('/api/gemini/generate-map')
        .send({
          requirements: {
            plotLength: 10,
            plotWidth: 10,
            bedrooms: 2,
            bathrooms: 1,
            kitchen: true,
            livingRoom: true
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('plotDimensions');
      expect(response.body.data).toHaveProperty('rooms');
      expect(response.body.data.rooms).toBeInstanceOf(Array);
    });

    it('should validate generated map data structure', async () => {
      const response = await request(app)
        .post('/api/gemini/generate-map')
        .send({
          requirements: {
            plotLength: 15,
            plotWidth: 12,
            bedrooms: 3,
            bathrooms: 2,
            kitchen: true,
            livingRoom: true,
            diningRoom: true
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('plotDimensions');
      expect(response.body.data.plotDimensions).toHaveProperty('length');
      expect(response.body.data.plotDimensions).toHaveProperty('width');
      expect(response.body.data).toHaveProperty('rooms');
      
      // Validate room structure
      response.body.data.rooms.forEach(room => {
        expect(room).toHaveProperty('id');
        expect(room).toHaveProperty('type');
        expect(room).toHaveProperty('x');
        expect(room).toHaveProperty('y');
      });
    });
  });
});

describe('Export PDF Integration Tests', () => {
  const exportPdfRoutes = require('../routes/export-pdf');
  const pdfApp = express();
  pdfApp.use(express.json({ limit: '10mb' }));
  pdfApp.use('/api/export', exportPdfRoutes);

  describe('POST /api/export/pricing-pdf', () => {
    it('should return 400 if prediction data is missing', async () => {
      const response = await request(pdfApp)
        .post('/api/export/pricing-pdf')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should generate PDF for pricing prediction', async () => {
      const response = await request(pdfApp)
        .post('/api/export/pricing-pdf')
        .send({
          prediction: 5000000,
          propertyDetails: {
            area: 1200,
            bedrooms: 3,
            bathrooms: 2,
            location: 'Test Location'
          },
          breakdown: [
            { category: 'Base Price', cost: 3000000 },
            { category: 'Location Premium', cost: 1500000 },
            { category: 'Amenities', cost: 500000 }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('price-estimate');
    });
  });

  describe('POST /api/export/map-pdf', () => {
    it('should return 400 if map data and image data are missing', async () => {
      const response = await request(pdfApp)
        .post('/api/export/map-pdf')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should generate PDF for floor plan map', async () => {
      const response = await request(pdfApp)
        .post('/api/export/map-pdf')
        .send({
          mapData: {
            plotDimensions: { length: 10, width: 10 },
            rooms: [],
            metadata: { generatedAt: new Date().toISOString() }
          },
          projectDetails: {
            name: 'Test Project'
          }
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('floor-plan');
    });
  });
});
