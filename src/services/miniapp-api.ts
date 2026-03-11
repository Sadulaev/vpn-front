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

export interface SubscriptionItem {
  id: string;
  marzbanUsername: string | null;
  status: string | null;
  expire: number | null;
  subscriptionUrl: string | null;
  usedTraffic: number | null;
  dataLimit: number;
  days: number;
  startDate: string | null;
  createdAt: string;
}

export interface NodeData {
  id: number;
  name: string;
  address: string;
  status: 'connected' | 'connecting' | 'error' | 'disabled';
  message: string | null;
  xrayVersion: string | null;
}

export interface NodesResponse {
  nodes: NodeData[];
  onlineUsers: number | null;
  totalUsers: number | null;
  activeUsers: number | null;
}

export interface SubscriptionPlan {
  months: number;
  price: number;
  label: string;
  dataLimitGB?: number;
  planType?: 'standard' | 'anti-throttling';
  description?: string;
}

export interface PaymentLinkResponse {
  paymentUrl: string;
  invId: string;
}

export const miniappAPI = {
  getSubscriptions: (): Promise<SubscriptionItem[]> =>
    miniappClient.get<SubscriptionItem[]>('/miniapp/subscriptions').then((r) => r.data),

  deleteSubscription: (id: string): Promise<void> =>
    miniappClient.delete(`/miniapp/subscriptions/${id}`).then(() => undefined),

  createPayment: (period: number, price: number, subscriptionId?: string): Promise<PaymentLinkResponse> =>
    miniappClient
      .post<PaymentLinkResponse>('/miniapp/pay', { period, price, subscriptionId })
      .then((r) => r.data),

  getPlans: (): Promise<SubscriptionPlan[]> =>
    miniappClient.get<SubscriptionPlan[]>('/miniapp/plans').then((r) => r.data),

  getNodes: (): Promise<NodesResponse> =>
    miniappClient.get<NodesResponse>('/miniapp/nodes').then((r) => r.data),
};
