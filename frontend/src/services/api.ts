import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  User,
  Product,
  SyncLog,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  ProductsResponse,
  LogsResponse,
  ProductFormData,
  LogStats,
  FilterOptions,
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
      timeout: 10000,
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
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
  }

  // Auth methods
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', data);
    return response.data;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    const response: AxiosResponse<{ user: User }> = await this.api.get('/auth/me');
    return response.data;
  }

  async logout(): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.post('/auth/logout');
    return response.data;
  }

  // Product methods
  async getProducts(filters: FilterOptions = {}): Promise<ProductsResponse> {
    const response: AxiosResponse<ProductsResponse> = await this.api.get('/products', {
      params: filters,
    });
    return response.data;
  }

  async getProduct(id: string): Promise<{ product: Product }> {
    const response: AxiosResponse<{ product: Product }> = await this.api.get(`/products/${id}`);
    return response.data;
  }

  async createProduct(data: ProductFormData): Promise<{ product: Product; message: string }> {
    const response: AxiosResponse<{ product: Product; message: string }> = await this.api.post(
      '/products',
      data
    );
    return response.data;
  }

  async updateProduct(
    id: string,
    data: Partial<ProductFormData>
  ): Promise<{ product: Product; message: string }> {
    const response: AxiosResponse<{ product: Product; message: string }> = await this.api.put(
      `/products/${id}`,
      data
    );
    return response.data;
  }

  async deleteProduct(id: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.api.delete(`/products/${id}`);
    return response.data;
  }

  async syncProducts(products: ProductFormData[], source = 'api'): Promise<{
    message: string;
    results: {
      created: number;
      updated: number;
      errors: number;
      total: number;
    };
    duration: number;
  }> {
    const response = await this.api.post('/products/sync', { products, source });
    return response.data;
  }

  async getCategories(): Promise<{ categories: string[] }> {
    const response: AxiosResponse<{ categories: string[] }> = await this.api.get('/products/categories/list');
    return response.data;
  }

  async getVendors(): Promise<{ vendors: string[] }> {
    const response: AxiosResponse<{ vendors: string[] }> = await this.api.get('/products/vendors/list');
    return response.data;
  }

  // Log methods
  async getLogs(filters: FilterOptions = {}): Promise<LogsResponse> {
    const response: AxiosResponse<LogsResponse> = await this.api.get('/logs', {
      params: filters,
    });
    return response.data;
  }

  async getLog(id: string): Promise<{ log: SyncLog }> {
    const response: AxiosResponse<{ log: SyncLog }> = await this.api.get(`/logs/${id}`);
    return response.data;
  }

  async getLogStats(): Promise<LogStats> {
    const response: AxiosResponse<LogStats> = await this.api.get('/logs/stats/overview');
    return response.data;
  }

  async getLogTimeline(days = 7): Promise<{
    timeline: Array<{
      _id: string;
      levels: Array<{ level: string; count: number }>;
      total: number;
    }>;
  }> {
    const response = await this.api.get('/logs/stats/timeline', {
      params: { days },
    });
    return response.data;
  }

  async getUserLogs(userId: string, filters: FilterOptions = {}): Promise<LogsResponse> {
    const response: AxiosResponse<LogsResponse> = await this.api.get(`/logs/user/${userId}`, {
      params: filters,
    });
    return response.data;
  }

  async exportLogs(filters: FilterOptions = {}): Promise<Blob> {
    const response = await this.api.get('/logs/export/csv', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  }

  async cleanupLogs(days = 30): Promise<{ message: string; deletedCount: number }> {
    const response = await this.api.delete('/logs/cleanup', {
      params: { days },
    });
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.api.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;