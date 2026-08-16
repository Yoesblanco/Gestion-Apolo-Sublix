import { apiClient } from './apiClient';
import { User, AuthResponse } from '../types';

export const authService = {
  login: async (identifier: string, pass: string): Promise<AuthResponse> => {
    return apiClient<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password: pass }),
      requiresAuth: false,
    });
  },

  register: async (name: string, username: string, email: string, pass: string): Promise<{ message: string; user: User }> => {
    return apiClient<{ message: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, username, email, password: pass }),
      requiresAuth: false,
    });
  },

  updateProfile: async (userData: Partial<User>): Promise<{ message: string; user: User }> => {
    return apiClient<{ message: string; user: User }>('/api/auth/update', {
      method: 'POST',
      body: JSON.stringify(userData),
      requiresAuth: false,
    });
  },
};
