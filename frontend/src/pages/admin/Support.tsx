import { useEffect, useState } from 'react';
import { Button, Card, Container, Flex, Heading, ScrollArea, Text, TextArea } from '@radix-ui/themes';
import { api } from '../../api/axios';
import UserAvatarLink from '../../components/user/UserAvatarLink';
import { extractApiErrorMessage } from '../../shared/apiError';
import { SendIcon, AlertTriangleIcon } from '../../components/common/Icons';
import { usePageTitle } from '../../shared/usePageTitle';

type SupportMessage = {
  id: string;
  text: string;
  createdAt: string;
  userId: string;
  senderId: string;
  user: { id: string; name?: string | null; email: string; avatarUrl?: string | null };
  sender: { id: string; name?: string | null; avatarUrl?: string | null; role: 'USER' | 'ADMIN' };
};

export default function AdminSupportPage() {
  usePageTitle('Админ — Поддержка');
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  async function fetchAllMessages() {
    setError(null);
    try {
      const response = await api.get('/support/admin/all');
      setMessages(response.data.messages);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось загрузить сообщения'));
    }
  }

  useEffect(() => {
    setLoading(true);
    void fetchAllMessages().finally(() => setLoading(false));
    const interval = setInterval(() => void fetchAllMessages(), 3000);
    return () => clearInterval(interval);
  }, []);

  // Set initial selectedUserId only once if not set
  useEffect(() => {
    if (!selectedUserId && messages.length > 0) {
      const uniqueUserIds = Array.from(new Set(messages.map(m => m.userId)));
      setSelectedUserId(uniqueUserIds[0]);
    }
  }, []);


  const userChats = Array.from(new Map(messages.map(m => [m.userId, m.user])).entries()).map(([userId, user]) => ({
    userId,
    user,
    lastMessage: messages.filter(m => m.userId === userId).at(-1),
  }));

  // Ensure selectedUserId is still in the list, otherwise select first
  useEffect(() => {
    const userIds = userChats.map(c => c.userId);
    if (selectedUserId && !userIds.includes(selectedUserId) && userIds.length > 0) {
      setSelectedUserId(userIds[0]);
    }
  }, [userChats.length, selectedUserId]);

  const selectedChat = selectedUserId
    ? userChats.find(c => c.userId === selectedUserId)
    : null;

  const selectedMessages = selectedUserId
    ? messages
        .filter(m => m.userId === selectedUserId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  async function handleSendReply() {
    if (!selectedUserId || !replyText.trim()) return;

    setSendingReply(true);
    try {
      const response = await api.post(`/support/admin/reply/${selectedUserId}`, { text: replyText });
      setMessages([...messages, response.data]);
      setReplyText('');
    } catch (err) {
      const errorMsg = extractApiErrorMessage(err, 'Ошибка при отправке');
      setError(errorMsg);
      console.error('Error sending reply:', err);
    } finally {
      setSendingReply(false);
    }
  }

  if (loading) return <Container size="4"><Text>Загрузка...</Text></Container>;

  return (
    <Container size="4" style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-6)' }}>
      <Heading size="6" mb="4">Чаты поддержки</Heading>

      {error && <Text color="red" as="p" mb="3">{error}</Text>}

      {/* Mobile: show user list or chat */}
      <Flex gap="4" direction={{ initial: 'column', md: 'row' }} style={{ minHeight: '70vh' }}>
        {/* Users list */}
        <Card style={{
          width: '100%',
          maxWidth: '280px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--gray-2)',
        }}>
          <Text size="2" weight="bold" color="gray" mb="2">Пользователи</Text>
          <ScrollArea style={{ flex: 1 }}>
            {userChats.length === 0 ? (
              <Text as="p" size="2" color="gray">Нет чатов</Text>
            ) : (
              userChats.map(chat => (
                <Flex
                  key={chat.userId}
                  onClick={() => setSelectedUserId(chat.userId)}
                  style={{
                    padding: '10px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    marginBottom: '4px',
                    backgroundColor: selectedUserId === chat.userId ? 'var(--violet-3)' : 'transparent',
                    transition: 'background-color 0.2s',
                  }}
                  gap="2"
                  align="center"
                >
                  <UserAvatarLink userId={chat.user.id} name={chat.user.name} email={chat.user.email} avatarUrl={chat.user.avatarUrl} size="1" />
                  <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
                    <Text size="1" weight="medium" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {chat.user.name || chat.user.email}
                    </Text>
                    <Text size="1" color="gray" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {chat.lastMessage?.text}
                    </Text>
                  </Flex>
                </Flex>
              ))
            )}
          </ScrollArea>
        </Card>

        {/* Chat view */}
        <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--gray-1)', minHeight: '400px' }}>
          {!selectedChat ? (
            <Flex direction="column" align="center" justify="center" style={{ flex: 1 }}>
              <Text color="gray" align="center">Выберите чат слева</Text>
            </Flex>
          ) : (
            <>
              {/* Chat header */}
              <Flex pb="3" style={{ borderBottom: '1px solid var(--gray-a5)' }} align="center" gap="2">
                <UserAvatarLink userId={selectedChat.user.id} name={selectedChat.user.name} email={selectedChat.user.email} avatarUrl={selectedChat.user.avatarUrl} />
                <Flex direction="column" style={{ minWidth: 0 }}>
                  <Text size="2" weight="medium" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedChat.user.name || selectedChat.user.email}
                  </Text>
                  <Text size="1" color="gray" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedChat.user.email}
                  </Text>
                </Flex>
              </Flex>

              {/* Messages */}
              <ScrollArea style={{ flex: 1, minHeight: '200px', maxHeight: '50vh' }}>
                {selectedMessages.length === 0 ? (
                  <Flex direction="column" align="center" justify="center" style={{ height: '200px', padding: '20px' }}>
                    <AlertTriangleIcon width={48} height={48} />
                    <Heading size="4" align="center" mt="3">Нет сообщений</Heading>
                    <Text color="gray" align="center" size="2" mt="2">
                      Первое сообщение появится, когда пользователь напишет в поддержку
                    </Text>
                  </Flex>
                ) : (
                  <Flex direction="column" gap="3" p="3">
                    {selectedMessages.map((msg, idx) => {
                      const showSenderName = idx === 0 || selectedMessages[idx - 1]?.senderId !== msg.senderId;
                      return (
                        <Flex
                          key={msg.id}
                          direction="column"
                          gap="1"
                          style={{
                            alignSelf: msg.sender.role === 'ADMIN' ? 'flex-end' : 'flex-start',
                            maxWidth: '75%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            backgroundColor: msg.sender.role === 'ADMIN' ? 'var(--violet-4)' : 'var(--gray-3)',
                          }}
                        >
                          {showSenderName && (
                            <Text size="1" color={msg.sender.role === 'ADMIN' ? 'violet' : 'gray'}>
                              {msg.sender.name || (msg.sender.role === 'ADMIN' ? 'Админ' : 'Пользователь')}
                            </Text>
                          )}
                          <Text size="2">{msg.text}</Text>
                          <Text size="1" color="gray">
                            {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </Flex>
                      );
                    })}
                  </Flex>
                )}
              </ScrollArea>

              {/* Reply input */}
              <Flex gap="2" style={{ borderTop: '1px solid var(--gray-a4)', padding: '12px', backgroundColor: 'var(--gray-1)' }}>
                <TextArea
                  placeholder="Ответить..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  style={{ flex: 1, minHeight: 44, maxHeight: 120 }}
                  disabled={sendingReply}
                />
                <Button
                  onClick={() => void handleSendReply()}
                  disabled={!replyText.trim() || sendingReply}
                  style={{ height: 50, alignSelf: 'stretch' }}
                >
                  <SendIcon />
                </Button>
              </Flex>
            </>
          )}
        </Card>
      </Flex>
    </Container>
  );
}
