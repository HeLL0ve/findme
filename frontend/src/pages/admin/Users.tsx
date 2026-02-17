import { useEffect, useState } from 'react';
import { Button, Card, Container, Flex, Heading, Text } from '@radix-ui/themes';
import { api } from '../../api/axios';
import ConfirmActionDialog from '../../components/common/ConfirmActionDialog';
import UserAvatarLink from '../../components/user/UserAvatarLink';
import { useAuthStore } from '../../shared/authStore';
import { extractApiErrorMessage } from '../../shared/apiError';
import { roleLabel } from '../../shared/labels';

type User = {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  role: 'USER' | 'ADMIN';
  isBlocked: boolean;
};

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
    await api.post(`/users/${user.id}/block`, { block: !user.isBlocked });
    setUsers((prev) => prev.map((current) => (current.id === user.id ? { ...current, isBlocked: !current.isBlocked } : current)));
  }

  async function changeRole(user: User, role: 'USER' | 'ADMIN') {
    await api.post(`/users/${user.id}/role`, { role });
    setUsers((prev) => prev.map((current) => (current.id === user.id ? { ...current, role } : current)));
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
                <Flex align="center" gap="3" style={{ minWidth: 0 }}>
                  <UserAvatarLink
                    userId={user.id}
                    name={user.name}
                    email={user.email}
                    avatarUrl={user.avatarUrl}
                    subtitle={`${user.email} · ${roleLabel(user.role)}${user.isBlocked ? ' · заблокирован' : ''}`}
                  />
                </Flex>

                <Flex gap="2" wrap="wrap">
                  <ConfirmActionDialog
                    title={user.isBlocked ? 'Разблокировать пользователя?' : 'Заблокировать пользователя?'}
                    description={user.isBlocked ? 'Пользователь снова получит доступ к платформе.' : 'Пользователь не сможет пользоваться платформой.'}
                    confirmText={user.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                    color={user.isBlocked ? 'violet' : 'red'}
                    onConfirm={() => toggleBlock(user)}
                    trigger={<Button variant="outline">{user.isBlocked ? 'Разблокировать' : 'Заблокировать'}</Button>}
                  />

                  {user.role === 'ADMIN' ? (
                    <ConfirmActionDialog
                      title="Снять роль администратора?"
                      description="Пользователь будет переведен в обычную роль."
                      confirmText="Сделать пользователем"
                      color="orange"
                      onConfirm={() => changeRole(user, 'USER')}
                      trigger={<Button variant="soft">Сделать пользователем</Button>}
                    />
                  ) : (
                    <ConfirmActionDialog
                      title="Назначить администратором?"
                      description="Пользователь получит права модерации и управления."
                      confirmText="Назначить"
                      color="violet"
                      onConfirm={() => changeRole(user, 'ADMIN')}
                      trigger={<Button>Сделать админом</Button>}
                    />
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
