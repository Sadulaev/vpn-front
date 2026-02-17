import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Client {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  isActive: boolean;
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
  publicHost: string;
  publicPort: number;
  status: string;
  usersLimit: number;
  serverPoolId: number | null;
  serverPool?: ServerPool;
}

export interface Subscription {
  id: string;
  clientId: string;
  status: string;
  months: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface CreateSubscriptionDto {
  telegramId: string;
  username?: string;
  firstName?: string;
  months: number;
}

export interface CreatePoolDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateServerDto {
  name: string;
  apiUrl: string;
  username: string;
  password: string;
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
}

// API methods
export const clientsAPI = {
  getAll: () => api.get<Client[]>('/clients'),
  getById: (id: string) => api.get<Client>(`/clients/${id}`),
  create: (data: { telegramId: string; username?: string; firstName?: string }) =>
    api.post<Client>('/clients', data),
  update: (id: string, data: Partial<Client>) => api.put<Client>(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
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
  create: (data: CreateServerDto) => api.post<XuiServer>('/server-pools/servers', data),
  update: (id: number, data: Partial<CreateServerDto>) => 
    api.put<XuiServer>(`/server-pools/servers/${id}`, data),
  delete: (id: number) => api.delete(`/server-pools/servers/${id}`),
};

export const subscriptionsAPI = {
  getAll: () => api.get<Subscription[]>('/subscriptions'),
  getByTelegramId: (telegramId: string) => 
    api.get<Subscription[]>(`/subscriptions/telegram/${telegramId}`),
  create: (data: CreateSubscriptionDto) => api.post('/subscriptions', data),
  processExpired: () => api.post('/subscriptions/process-expired'),
};

export default api;
