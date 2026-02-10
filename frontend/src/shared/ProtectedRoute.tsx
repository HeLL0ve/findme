import { Navigate } from 'react-router-dom';
import { useAuthStore } from './authStore';
import type { JSX } from 'react';

type Props = { children: JSX.Element };

export default function ProtectedRoute({ children }: Props) {
  const token = useAuthStore((s) => s.accessToken);
  const initialized = useAuthStore((s) => s.initialized);

  if (!initialized) return <div style={{ padding: 24 }}>Загрузка...</div>;

  if (!token) return <Navigate to="/login" replace />;
  return children;
}
