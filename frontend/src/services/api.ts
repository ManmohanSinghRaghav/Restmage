import axios from 'axios';
import { User, Project, LoginCredentials, RegisterData } from '../types';

// Build a smart default API base URL so the app works on localhost and LAN IPs
// without additional configuration. You can still override it with
// VITE_API_URL or VITE_API_PORT.
const getDefaultApiBaseUrl = (): string => {
  try {
    const win: any = (typeof window !== 'undefined') ? window : undefined;
    const protocol = win?.location?.protocol || 'http:';
    const hostname = win?.location?.hostname || 'localhost';
    const port = import.meta.env.VITE_API_PORT || '5000';
    return `${protocol}//${hostname}:${port}/api`;
  } catch {
    return 'http://localhost:5000/api';
  }
};

const API_BASE_URL = import.meta.env.VITE_API_URL || getDefaultApiBaseUrl();
const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user'
};
const UNAUTHORIZED_STATUS = 401;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Prepare alternate API base URLs to transparently recover from host/port mismatches
const computeAltBaseUrls = (): string[] => {
  const list: string[] = [];
  try {
    const win: any = (typeof window !== 'undefined') ? window : undefined;
    const protocol = win?.location?.protocol || 'http:';
    const host = win?.location?.hostname || 'localhost';
    const port = process.env.REACT_APP_API_PORT || '5000';
    const currentHostUrl = `${protocol}//${host}:${port}/api`;
    if (currentHostUrl !== API_BASE_URL) list.push(currentHostUrl);
  } catch {}
  // Common local fallbacks
  if ('http://localhost:5000/api' !== API_BASE_URL) list.push('http://localhost:5000/api');
  if ('http://127.0.0.1:5000/api' !== API_BASE_URL) list.push('http://127.0.0.1:5000/api');
  return Array.from(new Set(list));
};
const ALT_BASE_URLS = computeAltBaseUrls();

const attachAuthToken = (config: any) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

const handleUnauthorizedError = (error: any) => {
  if (error.response?.status === UNAUTHORIZED_STATUS) {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    window.location.href = '/login';
  }
  return Promise.reject(error);
};

api.interceptors.request.use(attachAuthToken);
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // First, handle 401 the usual way
    if (error?.response?.status === UNAUTHORIZED_STATUS) {
      return handleUnauthorizedError(error);
    }

    // On pure network errors (no response), attempt alternate base URLs once
    const config = error?.config || {};
    if (!error.response && !config.__altTried && ALT_BASE_URLS.length > 0) {
      config.__altTried = true;
      for (const alt of ALT_BASE_URLS) {
        try {
          const retry = { ...config, baseURL: alt };
          const res = await axios.request(retry);
          return res;
        } catch (e) {
          // try next alt
        }
      }
    }

    return Promise.reject(error);
  }
);

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