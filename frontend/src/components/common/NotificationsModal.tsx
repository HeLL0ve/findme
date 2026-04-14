import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Dialog, Flex, Text } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { api } from '../../api/axios';
import { extractApiErrorMessage } from '../../shared/apiError';
import { notificationTypeLabel } from '../../shared/labels';

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function NotificationsModal({ open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/notifications', { params: { take: 50 } });
      setItems(response.data);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось загрузить уведомления'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      void load();
    }
  }, [open]);

  async function markRead(id: string) {
    try {
      await api.post(`/notifications/${id}/read`);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }

  async function markAllRead() {
    try {
      await api.post('/notifications/read-all');
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }

  async function requestPushPermission() {
    if (typeof Notification === 'undefined') {
      alert('Push-уведомления не поддерживаются в вашем браузере');
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === 'granted') {
        alert('Push-уведомления включены!');
      } else if (perm === 'denied') {
        alert('Вы отклонили push-уведомления. Измените это в настройках браузера.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      alert('Не удалось включить push-уведомления');
    }
  }

  const unread = useMemo(() => items.filter((item) => !item.isRead).length, [items]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="560px" style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <Flex justify="between" align="center" gap="2" wrap="wrap">
          <Dialog.Title>Уведомления</Dialog.Title>
          <Badge color={unread > 0 ? 'violet' : 'gray'}>Новых: {unread}</Badge>
        </Flex>

        {loading && <Text>Загрузка...</Text>}
        {error && <Text color="red">{error}</Text>}

        {!loading && !error && items.length === 0 && <Text color="gray">Уведомлений пока нет.</Text>}

        <Flex gap="2" align="center" wrap="wrap">
          {!loading && unread > 0 && (
            <Button size="1" variant="soft" onClick={() => void markAllRead()}>
              Отметить все прочитанными
            </Button>
          )}
          {permission !== 'unsupported' && permission !== 'granted' && (
            <Button size="1" variant="soft" onClick={() => void requestPushPermission()}>
              🔔 Включить push
            </Button>
          )}
        </Flex>

        <Flex
          direction="column"
          gap="2"
          style={{ overflow: 'auto', flex: 1, paddingRight: 8 }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                border: item.isRead ? '1px solid var(--gray-a4)' : '1px solid var(--violet-8)',
                borderRadius: 8,
                padding: 12,
              }}
            >
              <Flex justify="between" align="start" gap="2">
                <Flex direction="column" gap="1" style={{ minWidth: 0, flex: 1 }}>
                  <Flex align="center" gap="2" wrap="wrap">
                    <Badge variant="soft" size="1">
                      {notificationTypeLabel(item.type)}
                    </Badge>
                    {!item.isRead && <Badge color="violet" size="1">Новое</Badge>}
                  </Flex>
                  <Text weight="bold" className="truncate">
                    {item.title}
                  </Text>
                  <Text size="2">{item.message}</Text>
                  <Text size="1" color="gray">
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                  {item.link && (
                    <Link to={item.link} onClick={() => void markRead(item.id)} style={{ marginTop: 4 }}>
                      <Button size="1" variant="soft">
                        Перейти
                      </Button>
                    </Link>
                  )}
                </Flex>
                {!item.isRead && (
                  <Button
                    size="1"
                    variant="outline"
                    onClick={() => void markRead(item.id)}
                  >
                    Прочитано
                  </Button>
                )}
              </Flex>
            </div>
          ))}
        </Flex>

        <Flex gap="2" justify="end" mt="4">
          <Dialog.Close>
            <Button variant="soft">Закрыть</Button>
          </Dialog.Close>
          {items.length > 0 && (
            <Link to="/notifications">
              <Button>Открыть все</Button>
            </Link>
          )}
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
