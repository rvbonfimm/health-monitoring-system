import api from '@/lib/axios';
import { LoginRequest, RegisterRequest, AuthResponse } from '@/types';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async logout(): Promise<void> {
    // Implementar logout no backend se necessário
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
