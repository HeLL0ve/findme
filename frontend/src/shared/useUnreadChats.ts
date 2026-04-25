import { useEffect, useState } from 'react';
import { useAuthStore } from './authStore';
import { subscribeWs } from './wsClient';
import { api } from '../api/axios';

export function useUnreadChats() {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!token || !user) {
      setUnread(0);
      return;
    }

    let mounted = true;

    async function refresh() {
      try {
        const res = await api.get('/chats');
        if (!mounted) return;
        // Count chats that have at least one message not sent by current user
        // We use the last message as a proxy — if it exists and sender isn't us, count it
        const chats: Array<{
          messages: Array<{ senderId?: string; sender?: { id: string } }>;
        }> = res.data;
        const count = chats.filter((c) => {
          const last = c.messages?.[0];
          if (!last) return false;
          const senderId = last.senderId ?? last.sender?.id;
          return senderId && senderId !== user?.id;
        }).length;
        setUnread(count);
      } catch {
        if (mounted) setUnread(0);
      }
    }

    void refresh();

    const unsub = subscribeWs((msg) => {
      if (msg?.type === 'chat:new') void refresh();
    });

    const interval = setInterval(() => void refresh(), 15000);

    return () => {
      mounted = false;
      unsub();
      clearInterval(interval);
    };
  }, [token, user]);

  return unread;
}
