import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = '/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401 errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(username: string, password: string) {
    const { data } = await this.api.post('/auth/login', { username, password });
    return data;
  }

  // Servers
  async getServers() {
    const { data } = await this.api.get('/servers');
    return data;
  }

  async getServer(id: string) {
    const { data } = await this.api.get(`/servers/${id}`);
    return data;
  }

  async createServer(serverData: any) {
    const { data } = await this.api.post('/servers', serverData);
    return data;
  }

  async updateServer(id: string, serverData: any) {
    const { data } = await this.api.patch(`/servers/${id}`, serverData);
    return data;
  }

  async deleteServer(id: string) {
    await this.api.delete(`/servers/${id}`);
  }

  // Users
  async getUsers() {
    const { data } = await this.api.get('/users');
    return data;
  }

  async getUser(id: string) {
    const { data } = await this.api.get(`/users/${id}`);
    return data;
  }

  async createUser(userData: any) {
    const { data } = await this.api.post('/users', userData);
    return data;
  }

  async updateUser(id: string, userData: any) {
    const { data } = await this.api.patch(`/users/${id}`, userData);
    return data;
  }

  async deleteUser(id: string) {
    await this.api.delete(`/users/${id}`);
  }

  // Subscriptions
  async getSubscriptions() {
    const { data } = await this.api.get('/subscriptions');
    return data;
  }

  async getSubscription(id: string) {
    const { data } = await this.api.get(`/subscriptions/${id}`);
    return data;
  }

  async getUserSubscriptions(userId: string) {
    const { data } = await this.api.get(`/subscriptions/user/${userId}`);
    return data;
  }

  async createSubscription(subscriptionData: any) {
    const { data } = await this.api.post('/subscriptions', subscriptionData);
    return data;
  }

  async updateSubscription(id: string, subscriptionData: any) {
    const { data } = await this.api.patch(`/subscriptions/${id}`, subscriptionData);
    return data;
  }

  async deleteSubscription(id: string) {
    await this.api.delete(`/subscriptions/${id}`);
  }

  async extendSubscription(id: string, months: number) {
    const { data } = await this.api.post(`/subscriptions/${id}/extend`, { months });
    return data;
  }

  async changeSubscriptionServer(id: string, serverId: string) {
    const { data } = await this.api.post(`/subscriptions/${id}/change-server`, { serverId });
    return data;
  }

  async getStatistics() {
    const { data } = await this.api.get('/subscriptions/statistics');
    return data;
  }
}

export default new ApiService();
