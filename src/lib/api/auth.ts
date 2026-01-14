import { apiClient } from './client';
import { User } from '@mining-hub/types';

class AuthAPI {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  async handleCallback(code: string, state?: string) {
    const response = await apiClient.post('/auth/callback', { code, state });
    return response.data;
  }

  async getMe(): Promise<User> {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }

  // Mock login for development
  async mockLogin(email: string = 'admin@hetherington.com.au') {
    // In development, simulate OIDC callback
    return this.handleCallback('mock-code', 'mock-state');
  }
}

export const authApi = new AuthAPI();
