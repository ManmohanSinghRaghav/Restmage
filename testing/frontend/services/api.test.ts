/**
 * Example Service Test - API Service
 * Template for testing service modules and API interactions
 */

import axios from 'axios';
import { api, setAuthToken, removeAuthToken } from '../../../client/src/services/api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  describe('Base URL Detection', () => {
    test('uses localhost by default in development', () => {
      // Test that API is configured with correct base URL
      expect(api.defaults.baseURL).toBeDefined();
    });

    test('handles custom API URL from environment', () => {
      // Test environment variable override
      process.env.REACT_APP_API_URL = 'http://custom-api:5000/api';
      
      // Re-import or reconfigure API
      // This tests environment-based configuration
    });
  });

  describe('Authentication Token Management', () => {
    test('setAuthToken adds token to headers', () => {
      const token = 'test-jwt-token';
      setAuthToken(token);
      
      expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${token}`);
    });

    test('setAuthToken stores token in localStorage', () => {
      const token = 'test-jwt-token';
      setAuthToken(token);
      
      expect(localStorage.getItem('token')).toBe(token);
    });

    test('removeAuthToken clears token from headers', () => {
      setAuthToken('test-token');
      removeAuthToken();
      
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    });

    test('removeAuthToken removes token from localStorage', () => {
      setAuthToken('test-token');
      removeAuthToken();
      
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('API Request Methods', () => {
    test('GET request includes auth token', async () => {
      const mockResponse = { data: { projects: [] } };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      setAuthToken('test-token');
      await api.get('/projects');
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/projects',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token'
          })
        })
      );
    });

    test('POST request sends data correctly', async () => {
      const mockData = { name: 'Test Project' };
      const mockResponse = { data: { id: '123', ...mockData } };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);
      
      const result = await api.post('/projects', mockData);
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/projects', mockData, expect.any(Object));
      expect(result.data).toEqual(mockResponse.data);
    });

    test('handles network errors gracefully', async () => {
      const errorMessage = 'Network Error';
      mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage));
      
      await expect(api.get('/projects')).rejects.toThrow(errorMessage);
    });

    test('handles 401 unauthorized errors', async () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      };
      mockedAxios.get.mockRejectedValueOnce(error);
      
      await expect(api.get('/projects')).rejects.toEqual(error);
    });

    test('handles 404 not found errors', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Not Found' }
        }
      };
      mockedAxios.get.mockRejectedValueOnce(error);
      
      await expect(api.get('/projects/invalid-id')).rejects.toEqual(error);
    });
  });

  describe('Request Interceptors', () => {
    test('adds timestamp to requests', async () => {
      // Test if request interceptor adds timestamp or other metadata
      const mockResponse = { data: {} };
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      await api.get('/test');
      
      // Verify interceptor behavior
    });
  });

  describe('Response Interceptors', () => {
    test('handles token expiration', async () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'Token expired' }
        }
      };
      mockedAxios.get.mockRejectedValueOnce(error);
      
      // Test that interceptor handles token refresh or logout
      await expect(api.get('/projects')).rejects.toEqual(error);
    });
  });
});

/**
 * TESTING BEST PRACTICES FOR SERVICES:
 * 
 * 1. Mock external dependencies (axios, localStorage)
 * 2. Test both success and error paths
 * 3. Verify correct parameters are passed to HTTP methods
 * 4. Test authentication token handling
 * 5. Test error handling for different HTTP status codes
 * 6. Test interceptors and middleware
 * 7. Use meaningful test descriptions
 */
