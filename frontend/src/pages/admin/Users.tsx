import { useEffect, useState } from 'react';
import { api } from '../../api/axios';
import { useAuthStore } from '../../shared/authStore';
import { Button, Card, Container, Flex, Heading, Text } from '@radix-ui/themes';

type User = {
  id: string;
  email: string;
  name?: string | null;
  role: 'USER' | 'ADMIN';
  isBlocked: boolean;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const current = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!current || current.role !== 'ADMIN') return setError('Требуется доступ администратора');
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/users');
        if (!mounted) return;
        setUsers(res.data);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Ошибка');
      } finally { if (mounted) setLoading(false) }
    })();
    return () => { mounted = false };
  }, [current]);

  async function toggleBlock(u: User) {
    await api.post(`/users/${u.id}/block`, { block: !u.isBlocked });
    setUsers(users.map((x) => (x.id === u.id ? { ...x, isBlocked: !x.isBlocked } : x)));
  }

  async function changeRole(u: User, role: 'USER' | 'ADMIN') {
    await api.post(`/users/${u.id}/role`, { role });
    setUsers(users.map((x) => (x.id === u.id ? { ...x, role } : x)));
  }

  if (error) return <Container size="3"><Text color="red">{error}</Text></Container>;
  if (loading) return <Container size="3"><Text>Загрузка...</Text></Container>;

  return (
    <Container size="3">
      <Flex direction="column" gap="4">
        <Heading size="8">Пользователи</Heading>
        <Flex direction="column" gap="3">
          {users.map((u) => (
            <Card key={u.id}>
              <Flex justify="between" align="center" wrap="wrap" gap="3">
                <div>
                  <Text weight="bold">{u.name || u.email}</Text>
                  <Text size="2" color="gray">
                    {u.email} • {u.role} {u.isBlocked ? '• заблокирован' : ''}
                  </Text>
                </div>
                <Flex gap="2">
                  <Button variant="outline" onClick={() => void toggleBlock(u)}>
                    {u.isBlocked ? 'Разблокировать' : 'Блокировать'}
                  </Button>
                  {u.role === 'ADMIN' ? (
                    <Button variant="soft" onClick={() => void changeRole(u, 'USER')}>
                      Сделать USER
                    </Button>
                  ) : (
                    <Button onClick={() => void changeRole(u, 'ADMIN')}>
                      Сделать ADMIN
                    </Button>
                  )}
                </Flex>
              </Flex>
            </Card>
          ))}
        </Flex>
      </Flex>
    </Container>
  );
}
