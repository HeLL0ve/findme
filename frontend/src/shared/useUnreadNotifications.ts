import { useEffect, useState } from 'react';
import { api } from '../api/axios';
import { useAuthStore } from './authStore';
import { subscribeWs } from './wsClient';

export function useUnreadNotifications() {
  const token = useAuthStore((state) => state.accessToken);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let mounted = true;
    let interval: ReturnType<typeof setInterval> | null = null;

    async function refreshCount() {
      if (!token) {
        if (mounted) setUnread(0);
        return;
      }

      try {
        const response = await api.get('/notifications/unread-count');
        if (!mounted) return;
        setUnread(Number(response.data?.unread || 0));
      } catch (_err) {
        if (mounted) setUnread(0);
      }
    }

    void refreshCount();
    interval = setInterval(() => void refreshCount(), 12000);

    const unsubscribeWs = subscribeWs((msg) => {
      if (msg?.type === 'chat:new') {
        void refreshCount();
      }
    });

    return () => {
      mounted = false;
      unsubscribeWs();
      if (interval) clearInterval(interval);
    };
  }, [token]);

  return unread;
}
