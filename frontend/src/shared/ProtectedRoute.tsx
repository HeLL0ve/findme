import type { JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from './authStore';

type Props = {
  children: JSX.Element;
  requiredRole?: 'ADMIN';
};

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const token = useAuthStore((state) => state.accessToken);
  const initialized = useAuthStore((state) => state.initialized);
  const user = useAuthStore((state) => state.user);

  if (!initialized) {
    return <div style={{ padding: 24 }}>Загрузка...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
