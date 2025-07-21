export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  _id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  status: 'active' | 'inactive' | 'discontinued';
  images?: Array<{
    url: string;
    alt?: string;
  }>;
  tags?: string[];
  vendor?: string;
  lastSyncedAt: Date;
  syncSource: 'manual' | 'api' | 'csv' | 'xml';
  syncStatus: 'pending' | 'synced' | 'error';
  syncErrors?: Array<{
    field: string;
    message: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncLog {
  _id: string;
  operation: 'create' | 'update' | 'delete' | 'sync' | 'error' | 'info' | 'warning';
  entityType: 'product' | 'user' | 'system' | 'auth';
  entityId?: string;
  message: string;
  details?: any;
  userId?: string;
  username?: string;
  level: 'info' | 'warning' | 'error' | 'success';
  source: 'api' | 'web' | 'system' | 'sync';
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  status: 'success' | 'failed' | 'pending';
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginationInfo {
  current: number;
  pages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ProductsResponse {
  products: Product[];
  pagination: PaginationInfo;
}

export interface LogsResponse {
  logs: SyncLog[];
  pagination: PaginationInfo;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface ProductFormData {
  name: string;
  sku: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  status: 'active' | 'inactive' | 'discontinued';
  vendor?: string;
  tags?: string[];
}

export interface LogStats {
  overview: {
    total: number;
    today: number;
    yesterday: number;
    change: number;
  };
  operations: Array<{
    _id: string;
    count: number;
  }>;
  levels: Array<{
    _id: string;
    count: number;
  }>;
  recentActivity: SyncLog[];
}

export interface DashboardStats {
  products: {
    total: number;
    active: number;
    inactive: number;
    recentlyUpdated: number;
  };
  syncActivity: {
    todaySync: number;
    yesterdaySync: number;
    successRate: number;
    errorRate: number;
  };
  logs: LogStats;
}

export interface FilterOptions {
  search?: string;
  category?: string;
  status?: string;
  vendor?: string;
  operation?: string;
  level?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}