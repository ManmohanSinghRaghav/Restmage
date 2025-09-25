export interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  owner: User;
  collaborators: Array<{
    user: User;
    role: string;
  }>;
  propertyDetails: {
    type: 'residential' | 'commercial' | 'industrial' | 'mixed-use';
    location?: {
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    dimensions: {
      length: number;
      width: number;
      height: number;
      unit: 'feet' | 'meters';
    };
    materials: Array<{
      type: string;
      quantity: number;
      unit: string;
      pricePerUnit?: number;
    }>;
  };
  mapData: {
    bounds: number[][];
    layers: Array<{
      id: string;
      name: string;
      type: 'marker' | 'polygon' | 'line' | 'circle';
      data: any;
      style: any;
      visible: boolean;
    }>;
    center: {
      lat: number;
      lng: number;
    };
    zoom: number;
  };
  costEstimation?: {
    materials: number;
    labor: number;
    permits: number;
    equipment: number;
    total: number;
    currency: string;
    lastCalculated?: string;
    breakdown: Array<{
      category: string;
      item: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
    }>;
  };
  status: 'draft' | 'in-progress' | 'completed' | 'archived';
  isPublic: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface NotificationContextType {
  showNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export interface SocketContextType {
  socket: any;
  connected: boolean;
}