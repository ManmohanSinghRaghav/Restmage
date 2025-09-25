import axios, { AxiosResponse } from 'axios';
import { User, Project, LoginCredentials, RegisterData } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<{ user: User; token: string }> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put('/auth/profile', data);
    return response.data.user;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.put('/auth/change-password', { currentPassword, newPassword });
  },
};

// Projects API
export const projectsAPI = {
  getProjects: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<{
    projects: Project[];
    totalPages: number;
    currentPage: number;
    total: number;
  }> => {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  getProject: async (id: string): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  createProject: async (data: Partial<Project>): Promise<Project> => {
    const response = await api.post('/projects', data);
    return response.data.project;
  },

  updateProject: async (id: string, data: Partial<Project>): Promise<Project> => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data.project;
  },

  updateMapData: async (id: string, mapData: any): Promise<any> => {
    const response = await api.put(`/projects/${id}/map`, mapData);
    return response.data.mapData;
  },

  deleteProject: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  addCollaborator: async (id: string, email: string, role: string): Promise<void> => {
    await api.post(`/projects/${id}/collaborators`, { email, role });
  },
};

// Cost API
export const costAPI = {
  getMaterials: async (): Promise<any> => {
    const response = await api.get('/cost/materials');
    return response.data;
  },

  calculateCost: async (projectId: string): Promise<any> => {
    const response = await api.post(`/cost/${projectId}/calculate`);
    return response.data.costEstimation;
  },

  getCostEstimation: async (projectId: string): Promise<any> => {
    const response = await api.get(`/cost/${projectId}`);
    return response.data;
  },

  getMarketData: async (zipCode: string): Promise<any> => {
    const response = await api.get(`/cost/market/${zipCode}`);
    return response.data;
  },
};

// Maps API
export const mapsAPI = {
  getMapData: async (projectId: string): Promise<any> => {
    const response = await api.get(`/maps/${projectId}`);
    return response.data;
  },

  addLayer: async (projectId: string, layer: any): Promise<any> => {
    const response = await api.post(`/maps/${projectId}/layers`, { layer });
    return response.data;
  },

  deleteLayer: async (projectId: string, layerId: string): Promise<void> => {
    await api.delete(`/maps/${projectId}/layers/${layerId}`);
  },

  updateMapView: async (projectId: string, view: any): Promise<any> => {
    const response = await api.put(`/maps/${projectId}/view`, view);
    return response.data;
  },

  toggleLayerVisibility: async (projectId: string, layerId: string, visible: boolean): Promise<any> => {
    const response = await api.put(`/maps/${projectId}/layers/${layerId}/visibility`, { visible });
    return response.data;
  },
};

// Export API
export const exportAPI = {
  exportCSV: async (projectId: string): Promise<Blob> => {
    const response = await api.get(`/export/${projectId}/csv`, { responseType: 'blob' });
    return response.data;
  },

  exportPDF: async (projectId: string): Promise<Blob> => {
    const response = await api.get(`/export/${projectId}/pdf`, { responseType: 'blob' });
    return response.data;
  },

  exportJSON: async (projectId: string): Promise<Blob> => {
    const response = await api.get(`/export/${projectId}/json`, { responseType: 'blob' });
    return response.data;
  },
};

export default api;