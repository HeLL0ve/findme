import { Navigate } from 'react-router-dom';
import { useAuthStore } from './authStore';
import type { JSX } from 'react';

type Props = {
  children: JSX.Element;
  requiredRole?: 'ADMIN';
};

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const token = useAuthStore((s) => s.accessToken);
  const initialized = useAuthStore((s) => s.initialized);
  const user = useAuthStore((s) => s.user);

  if (!initialized) return <div style={{ padding: 24 }}>Загрузка...</div>;

  if (!token) return <Navigate to="/login" replace />;
  if (requiredRole && user?.role !== requiredRole) return <Navigate to="/" replace />;
  return children;
}
