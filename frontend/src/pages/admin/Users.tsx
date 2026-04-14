import { useEffect, useState } from 'react';
import { Container, Flex, Heading, Text } from '@radix-ui/themes';
import { api } from '../../api/axios';
import type { UserProfileType } from '../../components/user/UserProfileCard';
import UserProfileCard from '../../components/user/UserProfileCard';
import { useAuthStore } from '../../shared/authStore';
import { extractApiErrorMessage } from '../../shared/apiError';

type User = UserProfileType & {
  phone?: string | null;
  telegramUsername?: string | null;
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

  async function toggleBlock(userId: string, block: boolean) {
    await api.post(`/users/${userId}/block`, { block });
    setUsers((prev) => prev.map((current) => (current.id === userId ? { ...current, isBlocked: block } : current)));
  }

  async function changeRole(userId: string, role: 'USER' | 'ADMIN') {
    await api.post(`/users/${userId}/role`, { role });
    setUsers((prev) => prev.map((current) => (current.id === userId ? { ...current, role } : current)));
  }

  if (loading) return <Container size="3"><Text>Загрузка...</Text></Container>;
  if (error) return <Container size="3"><Text color="red">{error}</Text></Container>;

  return (
    <Container size="3">
      <Flex direction="column" gap="4">
        <Heading size="8">Пользователи ({users.length})</Heading>
        <Flex direction="column" gap="3">
          {users.map((user) => (
            <UserProfileCard
              key={user.id}
              user={user}
              isAdmin={true}
              showContactInfo={true}
              onBlockToggle={toggleBlock}
              onRoleChange={changeRole}
            />
          ))}
        </Flex>
      </Flex>
    </Container>
  );
}
