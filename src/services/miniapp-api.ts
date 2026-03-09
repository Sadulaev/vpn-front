import axios from 'axios';

const getInitData = (): string => {
  return window.Telegram?.WebApp?.initData ?? '';
};

const miniappClient = axios.create({
  baseURL: '/api',
});

miniappClient.interceptors.request.use((config) => {
  const initData = getInitData();
  if (initData) {
    config.headers['X-Telegram-Init-Data'] = initData;
  }
  return config;
});

export interface SubscriptionData {
  hasSubscription: boolean;
  id?: number;
  marzbanUsername?: string;
  status?: string;
  expire?: number | null;
  subscriptionUrl?: string | null;
  usedTraffic?: number | null;
  dataLimit?: number;
  days?: number;
  startDate?: string | null;
}

export interface NodeData {
  id: number;
  name: string;
  address: string;
  status: 'connected' | 'connecting' | 'error' | 'disabled';
  message: string | null;
  xrayVersion: string | null;
}

export const miniappAPI = {
  getMe: (): Promise<SubscriptionData> =>
    miniappClient.get<SubscriptionData>('/miniapp/me').then((r) => r.data),

  getNodes: (): Promise<NodeData[]> =>
    miniappClient.get<NodeData[]>('/miniapp/nodes').then((r) => r.data),
};
