import { useEffect, useRef } from 'react';
import { api } from '../api/axios';
import { useAuthStore } from './authStore';
import { subscribeWs } from './wsClient';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  link?: string | null;
};

const STORAGE_KEY = 'shown_notification_ids_v1';

function loadShownIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set<string>();
  }
}

function saveShownIds(ids: Set<string>) {
  try {
    const values = Array.from(ids).slice(-200);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {
    // ignore storage errors
  }
}

export function useBrowserNotifications() {
  const token = useAuthStore((state) => state.accessToken);
  const notifyWeb = useAuthStore((state) => state.user?.notificationSettings?.notifyWeb);
  const shownIdsRef = useRef<Set<string>>(loadShownIds());

  useEffect(() => {
    if (!token) return;
    if (notifyWeb === false) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;

    let mounted = true;
    let interval: ReturnType<typeof setInterval> | null = null;

    async function pullAndNotify() {
      try {
        const response = await api.get('/notifications', { params: { unread: 1, take: 20 } });
        if (!mounted) return;

        const notifications = (response.data as NotificationItem[]).slice().reverse();
        const shownIds = shownIdsRef.current;

        notifications.forEach((item) => {
          if (shownIds.has(item.id)) return;
          shownIds.add(item.id);

          const browserNotification = new Notification(item.title, {
            body: item.message,
            tag: item.id,
          });

          browserNotification.onclick = () => {
            window.focus();
            window.location.assign(item.link || '/notifications');
          };
        });

        saveShownIds(shownIds);
      } catch {
        // silent fallback, in-app notifications still work
      }
    }

    void pullAndNotify();
    interval = setInterval(() => void pullAndNotify(), 12000);

    const unsubscribeWs = subscribeWs((msg) => {
      if (msg?.type === 'chat:new') {
        void pullAndNotify();
      }
    });

    return () => {
      mounted = false;
      unsubscribeWs();
      if (interval) clearInterval(interval);
    };
  }, [notifyWeb, token]);
}
