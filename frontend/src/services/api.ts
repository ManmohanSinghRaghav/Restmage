import axios from 'axios';
import { User, LoginCredentials, RegisterData } from '../types';

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
    const { access_token, user } = response.data;
    return { token: access_token, user };
  },

  register: async (data: RegisterData): Promise<{ user: User; token: string }> => {
    const response = await api.post('/auth/register', data);
    const { access_token, user } = response.data;
    return { token: access_token, user };
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put('/auth/me', data);
    return response.data;
  },
};

export default api;