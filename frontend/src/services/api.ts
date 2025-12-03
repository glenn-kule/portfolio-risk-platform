import axios from 'axios';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
  Portfolio,
  PortfolioCreate,
  Holding,
  HoldingCreate,
  RiskSnapshot,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  register: async (credentials: RegisterCredentials): Promise<User> => {
    const response = await api.post('/auth/register', credentials);
    return response.data;
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // FastAPI expects form data for OAuth2
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Portfolio API
export const portfolioApi = {
  getAll: async (): Promise<Portfolio[]> => {
    const response = await api.get('/portfolios');
    return response.data;
  },

  getById: async (id: number): Promise<Portfolio> => {
    const response = await api.get(`/portfolios/${id}`);
    return response.data;
  },

  create: async (data: PortfolioCreate): Promise<Portfolio> => {
    const response = await api.post('/portfolios', data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/portfolios/${id}`);
  },
};

// Holdings API
export const holdingsApi = {
  getAll: async (portfolioId: number): Promise<Holding[]> => {
    const response = await api.get(`/portfolios/${portfolioId}/holdings`);
    return response.data;
  },

  create: async (portfolioId: number, data: HoldingCreate): Promise<Holding> => {
    const response = await api.post(`/portfolios/${portfolioId}/holdings`, data);
    return response.data;
  },

  update: async (portfolioId: number, holdingId: number, data: HoldingCreate): Promise<Holding> => {
    const response = await api.put(`/portfolios/${portfolioId}/holdings/${holdingId}`, data);
    return response.data;
  },

  delete: async (portfolioId: number, holdingId: number): Promise<void> => {
    await api.delete(`/portfolios/${portfolioId}/holdings/${holdingId}`);
  },
};

// Risk API
export const riskApi = {
  compute: async (portfolioId: number): Promise<RiskSnapshot> => {
    const response = await api.post(`/portfolios/${portfolioId}/risk/compute`);
    return response.data;
  },

  getLatest: async (portfolioId: number): Promise<RiskSnapshot> => {
    const response = await api.get(`/portfolios/${portfolioId}/risk/latest`);
    return response.data;
  },

  getHistory: async (portfolioId: number): Promise<RiskSnapshot[]> => {
    const response = await api.get(`/portfolios/${portfolioId}/risk/history`);
    return response.data;
  },
};

export default api;