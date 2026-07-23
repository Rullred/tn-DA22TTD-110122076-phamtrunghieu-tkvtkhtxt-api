import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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
  login: (usernameOrEmail: string, password: string) => Promise<{ 
    otpRequired: boolean; 
    tempToken?: string;
    qrRequired?: boolean;
    loginToken?: string;
    qrCodeDataUrl?: string;
    confirmationLink?: string;
    expiresIn?: number;
    instruction?: string;
  }>;
  verifyOtp: (tempToken: string, otpCode: string) => Promise<void>;
  completeQrLogin: (accessToken: string, refreshToken: string, backendUser: any) => User;
  register: (username: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Decode the role claim from a JWT access token (used by the QR login flow,
// where the qr-status payload may return roles: null).
function decodeRoleFromToken(token?: string): UserRole | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    const raw = (payload.role || payload.roles?.[0] || '').toString().toLowerCase();
    if (raw === 'admin' || raw === 'teacher' || raw === 'student') {
      return raw as UserRole;
    }
    return null;
  } catch {
    return null;
  }
}

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
      
      // Check if this is QR Login flow (new 2FA)
      if ((authData as any).loginToken) {
        // This is QR login response, return it for QR display
        return {
          otpRequired: false,
          qrRequired: true,
          loginToken: (authData as any).loginToken,
          qrCodeDataUrl: (authData as any).qrCodeDataUrl,
          confirmationLink: (authData as any).confirmationLink,
          expiresIn: (authData as any).expiresIn,
          instruction: (authData as any).instruction
        };
      }
      
      // Check if OTP is required (old TOTP flow)
      if (authData.otpRequired) {
        return { otpRequired: true, tempToken: authData.tempToken };
      }

      // Direct login (has user and tokens)
      const backendUser = authData.user;
      if (!backendUser) {
        throw new Error('Invalid response from server');
      }
      
      const normalizedUser: User = {
        id: backendUser.id,
        name: backendUser.username,
        email: backendUser.email,
        role: backendUser.role.toLowerCase() as UserRole,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${backendUser.username}`
      };

      if (authData.accessToken && authData.refreshToken) {
        localStorage.setItem('accessToken', authData.accessToken);
        localStorage.setItem('refreshToken', authData.refreshToken);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        setUser(normalizedUser);
      }
      return { otpRequired: false };
    } catch (error: any) {
      throw error;
    }
  };

  const verifyOtp = async (tempToken: string, otpCode: string) => {
    try {
      const authData = await authService.verifyOtp({ tempToken, otpCode });
      const backendUser = authData.user;

      const normalizedUser: User = {
        id: backendUser.id,
        name: backendUser.username,
        email: backendUser.email,
        role: backendUser.role.toLowerCase() as UserRole,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${backendUser.username}`
      };

      if (authData.accessToken && authData.refreshToken) {
        localStorage.setItem('accessToken', authData.accessToken);
        localStorage.setItem('refreshToken', authData.refreshToken);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        setUser(normalizedUser);
      }
    } catch (error: any) {
      throw error;
    }
  };


  // Finalize login after the phone confirms the QR code. Unlike the manual
  // localStorage writes the poll used before, this also updates React state
  // (setUser) so ProtectedRoute sees the user as authenticated instead of
  // bouncing back to /login. Role is taken from the token when the qr-status
  // user payload doesn't include it (roles: null).
  // useCallback keeps the reference stable so Login.tsx's polling interval
  // (which lists this in its effect deps) isn't torn down and recreated on
  // every countdown re-render.
  const completeQrLogin = useCallback((accessToken: string, refreshToken: string, backendUser: any): User => {
    const role: UserRole =
      (backendUser?.role?.toLowerCase() as UserRole) ||
      (backendUser?.roles?.[0]?.toLowerCase() as UserRole) ||
      decodeRoleFromToken(accessToken) ||
      'student';

    const normalizedUser: User = {
      id: backendUser.id,
      name: backendUser.username,
      email: backendUser.email,
      role,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${backendUser.username}`,
    };

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    return normalizedUser;
  }, []);

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
    <AuthContext.Provider value={{ user, loading, login, verifyOtp, completeQrLogin, register, logout, isAuthenticated: !!user }}>
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
