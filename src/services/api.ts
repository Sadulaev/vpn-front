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
  // Fields stored in our DB
  id: string;
  marzbanUsername: string | null;
  telegramId: string | null;
  source: string;
  /** Total purchased days */
  days: number;
  startDate: string;
  createdAt: string;
  updatedAt: string;
  isAntiThrottling: boolean;
  /** User-defined subscription name stored in DB */
  name: string | null;
  // Enriched from Marzban (null if not yet migrated)
  marzbanStatus: string | null;
  /** Unix timestamp (seconds) of subscription expiry. null = unlimited. */
  marzbanExpire: number | null;
  subscriptionUrl: string | null;
  note: string | null;
  usedTraffic: number | null;
}

export interface CreateSubscriptionDto {
  telegramId?: string;
  days: number;
  source?: 'admin' | 'bot';
  note?: string;
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
  exportCsv: (params?: { search?: string; source?: string }) =>
    api.get('/subscriptions/export-csv', { params, responseType: 'blob' }),
  exportUniqueTelegramIds: () =>
    api.get('/subscriptions/export-unique-telegram-ids', { responseType: 'blob' }),
  getUnsynced: () => api.get<Subscription[]>('/subscriptions/unsynced'),
  sync: () => api.post<{ success: boolean; data: { synced: number; failed: number; errors: string[] } }>('/subscriptions/sync'),
};

export const paymentsAPI = {
  getPaidSessions: (params?: GetPaidSessionsParams) => 
    api.get<PaginatedPaymentSessions>('/payment/paid-sessions', { params }),
  getRandomPaidSessions: (params: GetRandomPaidSessionsParams) => 
    api.get<PaymentSession[]>('/payment/paid-sessions/random', { params }),
  sendTelegramMessage: (data: SendTelegramMessageDto) => 
    api.post<{ success: boolean; message: string }>('/payment/send-telegram-message', data),
  exportCsv: (params?: { dateFrom?: string; dateTo?: string }) =>
    api.get('/payment/export-csv', { params, responseType: 'blob' }),
};

export default api;
