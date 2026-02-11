import { useEffect } from 'react';
import { useAuthStore } from './authStore';
import { connectWs } from './wsClient';

export function useWsConnection() {
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    connectWs(token);
  }, [token]);
}
