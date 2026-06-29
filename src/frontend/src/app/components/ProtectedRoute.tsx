import { Navigate, useLocation } from 'react-router';
import { useAuth, UserRole } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-950 text-white">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-b-blue-500 border-t-transparent border-r-transparent border-l-transparent animate-spin [animation-duration:1.5s]"></div>
        </div>
        <p className="mt-4 text-sm font-medium text-blue-200 animate-pulse">Đang tải thông tin xác thực...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Redirect to login page and save the redirect path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on current role if not authorized
    const fallbackPath = user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/student';
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
