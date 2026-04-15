import { useEffect, useState } from 'react';
import { Container, Flex, Heading, Text, Dialog, Button, TextArea } from '@radix-ui/themes';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

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

  async function handleStartChat(userId: string) {
    setSelectedUserId(userId);
    setMessageDialogOpen(true);
    setMessageText('');
  }

  async function handleSendMessage() {
    if (!selectedUserId || !messageText.trim()) return;

    setSendingMessage(true);
    try {
      await api.post('/support/with-admin/message', { text: messageText });
      setMessageDialogOpen(false);
      setMessageText('');
      setSelectedUserId(null);
    } catch (err) {
      alert(extractApiErrorMessage(err, 'Ошибка при отправке сообщения'));
    } finally {
      setSendingMessage(false);
    }
  }

  function handleUserClick(userId: string) {
    navigate(`/users/${userId}`);
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
              clickable={true}
              onBlockToggle={toggleBlock}
              onRoleChange={changeRole}
              onStartChat={handleStartChat}
              onUserClick={handleUserClick}
            />
          ))}
        </Flex>
      </Flex>

      {/* Message Dialog */}
      <Dialog.Root open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <Dialog.Content maxWidth="500px">
          <Dialog.Title>Написать сообщение пользователю</Dialog.Title>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <TextArea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Введите сообщение..."
              style={{
                minHeight: '120px',
                padding: '10px 12px',
                border: '1px solid var(--gray-a6)',
                borderRadius: '6px',
                fontFamily: 'inherit',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Dialog.Close>
                <Button variant="soft">Отмена</Button>
              </Dialog.Close>
              <Button
                onClick={() => handleSendMessage()}
                disabled={sendingMessage || !messageText.trim()}
              >
                {sendingMessage ? 'Отправка...' : 'Отправить'}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Root>
    </Container>
  );
}
