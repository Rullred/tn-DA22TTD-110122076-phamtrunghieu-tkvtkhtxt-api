import { api } from './api';

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  isLocked: boolean;
  failedLoginAttempts: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export const authService = {
  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/api/auth/login', data);
      return response.data.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/api/auth/register', data);
      return response.data.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>('/api/auth/refresh', {
        refreshToken,
      });
      return response.data.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Logout user
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      await api.post('/api/auth/logout', { refreshToken });
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  },

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<ApiResponse<User>>('/api/auth/me');
      return response.data.data;
    } catch (error: any) {
      throw error;
    }
  },
};

export default authService;
