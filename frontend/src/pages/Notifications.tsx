import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Container, Flex, Heading, Text, Section } from '@radix-ui/themes';
import { api } from '../api/axios';
import { extractApiErrorMessage } from '../shared/apiError';
import { notificationTypeLabel } from '../shared/labels';
import { usePageTitle } from '../shared/usePageTitle';
import { BellIcon } from '../components/common/Icons';

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );
  usePageTitle('Уведомления');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/notifications', { params: { take: 100 } });
      setItems(response.data);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось загрузить уведомления'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const unread = useMemo(() => items.filter((item) => !item.isRead).length, [items]);

  async function markRead(id: string) {
    try {
      await api.post(`/notifications/${id}/read`);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось отметить уведомление'));
    }
  }

  async function markAllRead() {
    try {
      await api.post('/notifications/read-all');
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось отметить все уведомления'));
    }
  }

  async function requestPushPermission() {
    if (typeof Notification === 'undefined') {
      alert('Push-уведомления не поддерживаются в вашем браузере');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        alert('Push-уведомления включены!');
      } else if (permission === 'denied') {
        alert('Вы отклонили push-уведомления. Измените это в настройках браузера.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      alert('Не удалось включить push-уведомления');
    }
  }

  return (
    <>
      <Section size="2" style={{
        background: 'linear-gradient(135deg, var(--violet-2) 0%, var(--accent-soft) 100%)',
        borderBottom: '1px solid var(--gray-a5)',
      }}>
        <Container size="3">
          <Flex justify="between" align="center" wrap="wrap" gap="3">
            <Heading size="8" weight="bold">
              <Flex align="center" gap="3">
                <BellIcon width={32} height={32} color="var(--violet-11)" />
                Уведомления
              </Flex>
            </Heading>
            <Flex gap="2" align="center" wrap="wrap">
              <Badge color={unread > 0 ? 'violet' : 'gray'}>Непрочитанные: {unread}</Badge>
              {permission !== 'unsupported' && permission !== 'granted' && (
                <Button variant="soft" onClick={() => void requestPushPermission()}>
                  Включить push
                </Button>
              )}
              <Button variant="soft" onClick={() => void markAllRead()} disabled={unread === 0}>
                Прочитать все
              </Button>
            </Flex>
          </Flex>
        </Container>
      </Section>

      <Container size="3" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
        <Flex direction="column" gap="4">
          {loading && <Text>Загрузка...</Text>}
          {error && <Text color="red">{error}</Text>}
          {!loading && !error && items.length === 0 && <Text color="gray">Уведомлений пока нет.</Text>}

          <Flex direction="column" gap="2">
          {items.map((item) => (
            <Card key={item.id} style={{ border: item.isRead ? undefined : '1px solid var(--violet-8)' }}>
              <Flex justify="between" align="start" gap="2">
                <Flex direction="column" gap="1" style={{ minWidth: 0 }}>
                  <Flex align="center" gap="2" wrap="wrap">
                    <Badge variant="soft">{notificationTypeLabel(item.type)}</Badge>
                    {!item.isRead && <Badge color="violet">Новое</Badge>}
                  </Flex>
                  <Text weight="bold" className="truncate">{item.title}</Text>
                  <Text size="2">{item.message}</Text>
                  <Text size="1" color="gray">{new Date(item.createdAt).toLocaleString()}</Text>
                  {item.link && (
                    <Link to={item.link} onClick={() => void markRead(item.id)}>
                      Перейти
                    </Link>
                  )}
                </Flex>
                {!item.isRead && (
                  <Button size="1" variant="outline" onClick={() => void markRead(item.id)}>
                    Прочитано
                  </Button>
                )}
              </Flex>
            </Card>
          ))}
          </Flex>
        </Flex>
      </Container>
    </>
  );
}
