import { useEffect, useState } from 'react';
import { Avatar, Button, Card, Container, Flex, Heading, Text } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { useAuthStore } from '../../shared/authStore';
import { extractApiErrorMessage } from '../../shared/apiError';
import { roleLabel } from '../../shared/labels';
import { config } from '../../shared/config';

type User = {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  role: 'USER' | 'ADMIN';
  isBlocked: boolean;
};

function resolveAvatarSrc(avatarUrl?: string | null) {
  if (!avatarUrl) return undefined;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  return `${config.apiUrl}${avatarUrl}`;
}

export default function AdminUsers() {
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      setError('Требуется доступ администратора');
      setLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const response = await api.get('/users');
        if (!mounted) return;
        setUsers(response.data);
      } catch (err) {
        if (!mounted) return;
        setError(extractApiErrorMessage(err, 'Не удалось загрузить пользователей'));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [currentUser]);

  async function toggleBlock(user: User) {
    try {
      await api.post(`/users/${user.id}/block`, { block: !user.isBlocked });
      setUsers((prev) => prev.map((current) => (current.id === user.id ? { ...current, isBlocked: !current.isBlocked } : current)));
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось изменить блокировку'));
    }
  }

  async function changeRole(user: User, role: 'USER' | 'ADMIN') {
    try {
      await api.post(`/users/${user.id}/role`, { role });
      setUsers((prev) => prev.map((current) => (current.id === user.id ? { ...current, role } : current)));
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось изменить роль'));
    }
  }

  if (loading) return <Container size="3"><Text>Загрузка...</Text></Container>;
  if (error) return <Container size="3"><Text color="red">{error}</Text></Container>;

  return (
    <Container size="3">
      <Flex direction="column" gap="4">
        <Heading size="8">Пользователи</Heading>
        <Flex direction="column" gap="3">
          {users.map((user) => (
            <Card key={user.id}>
              <Flex justify="between" align="center" wrap="wrap" gap="3">
                <Flex align="center" gap="3">
                  <Avatar
                    src={resolveAvatarSrc(user.avatarUrl)}
                    fallback={(user.name || user.email).slice(0, 1).toUpperCase()}
                    radius="full"
                  />
                  <div>
                    <Text weight="bold">{user.name || user.email}</Text>
                    <Text as="div" size="2" color="gray">
                      {user.email} · {roleLabel(user.role)}
                      {user.isBlocked ? ' · заблокирован' : ''}
                    </Text>
                  </div>
                </Flex>

                <Flex gap="2" wrap="wrap">
                  <Button variant="outline" onClick={() => void toggleBlock(user)}>
                    {user.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                  </Button>
                  {user.role === 'ADMIN' ? (
                    <Button variant="soft" onClick={() => void changeRole(user, 'USER')}>
                      Сделать пользователем
                    </Button>
                  ) : (
                    <Button onClick={() => void changeRole(user, 'ADMIN')}>
                      Сделать админом
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
