import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Subscription {
  id: string;
  clientId: string;
  telegramId?: string | null;
  status: string;
  source: string;
  note?: string | null;
  months: number;
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
  apiUrl: string;
  webBasePath?: string;
  username?: string;
  password?: string;
  inboundId?: number;
  publicHost: string;
  publicPort: number;
  security?: string;
  pbk?: string;
  fp?: string;
  sni?: string;
  sid?: string;
  spx?: string;
  flow?: string;
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
  months: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface CreateSubscriptionDto {
  clientId?: string;
  telegramId?: string;
  months: number;
  source?: 'admin' | 'bot';
  note?: string;
}

export interface CreatePoolDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateServerDto {
  name: string;
  apiUrl: string;
  webBasePath?: string;
  username: string;
  password: string;
  inboundId?: number;
  publicHost: string;
  publicPort?: number;
  security?: string;
  pbk: string;
  fp?: string;
  sni: string;
  sid: string;
  spx?: string;
  flow?: string;
  serverPoolId?: number;
  usersLimit?: number;
  status?: string;
}

export interface SendMessageDto {
  message: string;
  telegramId?: string;
}

// API methods
export const subscriptionsAPI = {
  getAll: (params?: { search?: string; source?: string }) => 
    api.get<Subscription[]>('/subscriptions', { params }),
  create: (data: CreateSubscriptionDto) => api.post('/subscriptions', data),
  processExpired: () => api.post('/subscriptions/process-expired'),
  getUrl: (id: string) => api.get<{ success: boolean; data: { subscriptionUrl: string } }>(`/subscriptions/${id}/url`),
  delete: (id: string) => api.post(`/subscriptions/${id}/delete`),
  sendMessage: (data: SendMessageDto) => api.post<{ success: boolean; data: { sent: number; failed: number; errors: string[] } }>('/subscriptions/send-message', data),
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
  sync: (id: number) => api.post<{ total: number; success: number; failed: number; errors: string[] }>(`/server-pools/servers/${id}/sync`),
};

export default api;
