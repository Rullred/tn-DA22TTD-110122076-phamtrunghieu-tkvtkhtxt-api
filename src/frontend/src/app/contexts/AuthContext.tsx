import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../../services/authService';

export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  studentProfileId?: string;
  teacherProfileId?: string;
  classId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    try {
      // authService.login already unwraps ApiResponse<AuthResponse> → returns AuthResponse
      const authData = await authService.login({ usernameOrEmail, password });
      const backendUser = authData.user;

      const normalizedUser: User = {
        id: backendUser.id,
        name: backendUser.username,
        email: backendUser.email,
        role: backendUser.role.toLowerCase() as UserRole,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${backendUser.username}`
      };

      localStorage.setItem('accessToken', authData.accessToken);
      localStorage.setItem('refreshToken', authData.refreshToken);
      localStorage.setItem('user', JSON.stringify(normalizedUser));

      setUser(normalizedUser);
    } catch (error: any) {
      throw error;
    }
  };


  const register = async (username: string, email: string, password: string, role: string) => {
    try {
      const response = await authService.register({
        username,
        email,
        password,
        role: role.toUpperCase() as 'STUDENT' | 'TEACHER' | 'ADMIN',
      });
      
      const authData = response;
      const backendUser = authData.user;
      
      const normalizedUser: User = {
        id: backendUser.id,
        name: backendUser.username,
        email: backendUser.email,
        role: backendUser.role.toLowerCase() as UserRole,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${backendUser.username}`
      };
      
      localStorage.setItem('accessToken', authData.accessToken);
      localStorage.setItem('refreshToken', authData.refreshToken);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      
      setUser(normalizedUser);
    } catch (error: any) {
      throw error;
    }
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      authService.logout(refreshToken);
    }
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
