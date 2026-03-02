import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor для добавления JWT токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor для обработки 401 ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Удаляем токен и перенаправляем на логин
      localStorage.removeItem('access_token');
      localStorage.removeItem('isAuthenticated');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface Subscription {
  id: string;
  clientId: string;
  telegramId?: string | null;
  status: string;
  source: string;
  note?: string | null;
  days: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface ServerPool {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  servers?: XuiServer[];
}

export interface XuiServer {
  id: number;
  name: string;
  apiUrl?: string;
  webBasePath?: string;
  username?: string;
  password?: string;
  inboundId?: number;
  publicHost?: string;
  publicPort: number;
  security?: string;
  pbk?: string;
  fp?: string;
  sni?: string;
  sid?: string;
  spx?: string;
  flow?: string;
  displayOrder: number;
  isSeparator: boolean;
  separatorText?: string | null;
  status: string;
  usersLimit: number;
  serverPoolId: number | null;
  serverPool?: ServerPool;
}

export interface Subscription {
  id: string;
  clientId: string;
  status: string;
  note?: string | null;
  days: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface CreateSubscriptionDto {
  clientId?: string;
  telegramId?: string;
  days: number;
  source?: 'admin' | 'bot';
  note?: string;
  deviceLimit?: number;
}

export interface CreatePoolDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateServerDto {
  name: string;
  apiUrl?: string;
  webBasePath?: string;
  username?: string;
  password?: string;
  inboundId?: number;
  publicHost?: string;
  publicPort?: number;
  security?: string;
  pbk?: string;
  fp?: string;
  sni?: string;
  sid?: string;
  spx?: string;
  flow?: string;
  displayOrder?: number;
  isSeparator?: boolean;
  separatorText?: string;
  serverPoolId?: number;
  usersLimit?: number;
  status?: string;
}

export interface SyncStartResponse {
  status: 'started';
  serverId: number;
  serverName: string;
  estimatedTimeMs: number;
  message: string;
}

export interface SyncStatus {
  serverId: number;
  serverName: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  total: number;
  processed: number;
  success: number;
  failed: number;
  startedAt: string;
  completedAt?: string;
  estimatedTimeMs?: number;
  error?: string;
}

export interface SendMessageDto {
  message: string;
  telegramId?: string;
}

export interface SendMessageResponse {
  success: boolean;
  data?: { sent: number; failed: number; errors: string[] }; // Для одиночного сообщения
  message?: string; // Для массовой рассылки в фоне
}

export interface SendTelegramMessageDto {
  telegramId: string;
  message: string;
}

export interface PaymentSession {
  id: string;
  invId: string;
  telegramId: string;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  period: number;
  amount: number;
  createdAt: string;
  expiresAt: string | null;
}

export interface GetPaidSessionsParams {
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface GetRandomPaidSessionsParams extends GetPaidSessionsParams {
  count: number;
}

export interface PaginatedPaymentSessions {
  data: PaymentSession[];
  total: number;
  page: number;
  totalPages: number;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  expires_in: number;
}

// API methods
export const authAPI = {
  login: (data: LoginDto) => api.post<AuthResponse>('/auth/login', data),
};

export const subscriptionsAPI = {
  getAll: (params?: { search?: string; source?: string }) => 
    api.get<Subscription[]>('/subscriptions', { params }),
  create: (data: CreateSubscriptionDto) => api.post('/subscriptions', data),
  processExpired: () => api.post('/subscriptions/process-expired'),
  getUrl: (id: string) => api.get<{ success: boolean; data: { subscriptionUrl: string } }>(`/subscriptions/${id}/url`),
  delete: (id: string) => api.post(`/subscriptions/${id}/delete`),
  sendMessage: (data: SendMessageDto) => api.post<SendMessageResponse>('/subscriptions/send-message', data),
};

export const poolsAPI = {
  getAll: () => api.get<ServerPool[]>('/server-pools'),
  getById: (id: number) => api.get<ServerPool>(`/server-pools/${id}`),
  create: (data: CreatePoolDto) => api.post<ServerPool>('/server-pools', data),
  update: (id: number, data: Partial<CreatePoolDto>) => 
    api.put<ServerPool>(`/server-pools/${id}`, data),
  delete: (id: number) => api.delete(`/server-pools/${id}`),
};

export const serversAPI = {
  getAll: () => api.get<XuiServer[]>('/server-pools/servers'),
  getById: (id: number) => api.get<XuiServer>(`/server-pools/servers/${id}`),
  create: (data: CreateServerDto) => api.post('/server-pools/servers', data),
  update: (id: number, data: Partial<CreateServerDto>) => 
    api.put<XuiServer>(`/server-pools/servers/${id}`, data),
  delete: (id: number) => api.delete(`/server-pools/servers/${id}`),
  sync: (id: number) => api.post<SyncStartResponse>(`/server-pools/servers/${id}/sync`),
  getSyncStatus: (id: number) => api.get<SyncStatus>(`/server-pools/servers/${id}/sync-status`),
  getAllSyncStatuses: () => api.get<SyncStatus[]>('/server-pools/sync-status/all'),
  clearSyncStatus: (id: number) => api.delete(`/server-pools/servers/${id}/sync-status`),
  migrateEmails: (id: number) => api.post<{ total: number; updated: number; failed: number; errors: string[] }>(`/server-pools/servers/${id}/migrate-emails`),
  deleteExpiredClients: (id: number) => api.post<{ serversProcessed: number; clientsRemoved: number; errors: string[] }>(`/server-pools/servers/${id}/delete-expired-clients`),
};

export const paymentsAPI = {
  getPaidSessions: (params?: GetPaidSessionsParams) => 
    api.get<PaginatedPaymentSessions>('/payment/paid-sessions', { params }),
  getRandomPaidSessions: (params: GetRandomPaidSessionsParams) => 
    api.get<PaymentSession[]>('/payment/paid-sessions/random', { params }),
  sendTelegramMessage: (data: SendTelegramMessageDto) => 
    api.post<{ success: boolean; message: string }>('/payment/send-telegram-message', data),
};

export default api;
