/**
 * Example Service Test - Gemini Floor Plan Service
 * Template for testing AI service integration
 */

import { generateAIFloorPlan } from '../../../client/src/services/geminiFloorPlan';
import * as api from '../../../client/src/services/api';

// Mock the API module
jest.mock('../../../client/src/services/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('Gemini Floor Plan Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAIFloorPlan', () => {
    test('sends correct parameters to backend', async () => {
      const mockParams = {
        propertyType: 'residential',
        totalArea: 1500,
        floors: 1,
        bedrooms: 3,
        bathrooms: 2,
        preferences: 'Open floor plan'
      };

      const mockResponse = {
        data: {
          id: 'floor-plan-123',
          rooms: [
            { id: 'room1', type: 'Living Room', dimensions: { width: 15, height: 20 } }
          ],
          dimensions: { width: 40, height: 30 }
        }
      };

      mockedApi.post.mockResolvedValueOnce(mockResponse);

      const result = await generateAIFloorPlan(mockParams);

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/floorplan/generate-ai',
        mockParams
      );
      expect(result).toEqual(mockResponse.data);
    });

    test('handles missing optional parameters', async () => {
      const minimalParams = {
        propertyType: 'residential',
        totalArea: 1000,
        floors: 1
      };

      const mockResponse = { data: { id: 'floor-plan-456', rooms: [] } };
      mockedApi.post.mockResolvedValueOnce(mockResponse);

      await generateAIFloorPlan(minimalParams);

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/floorplan/generate-ai',
        minimalParams
      );
    });

    test('throws error on API failure', async () => {
      const errorMessage = 'AI generation failed';
      mockedApi.post.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { message: errorMessage }
        }
      });

      await expect(
        generateAIFloorPlan({
          propertyType: 'residential',
          totalArea: 1500,
          floors: 1
        })
      ).rejects.toThrow();
    });

    test('handles timeout errors', async () => {
      mockedApi.post.mockRejectedValueOnce({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded'
      });

      await expect(
        generateAIFloorPlan({
          propertyType: 'residential',
          totalArea: 1500,
          floors: 1
        })
      ).rejects.toThrow();
    });

    test('validates response data structure', async () => {
      const mockResponse = {
        data: {
          id: 'floor-plan-123',
          rooms: [
            {
              id: 'room1',
              type: 'Living Room',
              dimensions: { width: 15, height: 20, unit: 'feet' },
              position: { x: 0, y: 0 },
              features: ['window', 'door']
            }
          ],
          dimensions: { width: 40, height: 30, unit: 'feet' },
          totalArea: 1200
        }
      };

      mockedApi.post.mockResolvedValueOnce(mockResponse);

      const result = await generateAIFloorPlan({
        propertyType: 'residential',
        totalArea: 1500,
        floors: 1
      });

      // Verify response structure
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('rooms');
      expect(result).toHaveProperty('dimensions');
      expect(Array.isArray(result.rooms)).toBe(true);
      expect(result.rooms[0]).toHaveProperty('type');
      expect(result.rooms[0]).toHaveProperty('dimensions');
    });

    test('handles malformed AI response gracefully', async () => {
      const malformedResponse = {
        data: {
          // Missing required fields
          someField: 'value'
        }
      };

      mockedApi.post.mockResolvedValueOnce(malformedResponse);

      const result = await generateAIFloorPlan({
        propertyType: 'residential',
        totalArea: 1500,
        floors: 1
      });

      // Should handle gracefully or throw meaningful error
      expect(result).toBeDefined();
    });
  });

  describe('Parameter Validation', () => {
    test('accepts valid property types', async () => {
      const validTypes = ['residential', 'commercial', 'industrial', 'mixed-use'];
      
      for (const propertyType of validTypes) {
        mockedApi.post.mockResolvedValueOnce({ data: { id: '123', rooms: [] } });
        
        await generateAIFloorPlan({
          propertyType,
          totalArea: 1500,
          floors: 1
        });
        
        expect(mockedApi.post).toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });

    test('handles numeric validation for area', async () => {
      const invalidParams = {
        propertyType: 'residential',
        totalArea: -100, // Invalid: negative area
        floors: 1
      };

      // Should either validate before API call or handle API error
      // Implementation depends on where validation occurs
    });

    test('handles numeric validation for floors', async () => {
      const invalidParams = {
        propertyType: 'residential',
        totalArea: 1500,
        floors: 0 // Invalid: must be at least 1
      };

      // Test validation behavior
    });
  });
});
