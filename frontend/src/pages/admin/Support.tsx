import { useEffect, useState } from 'react';
import { Badge, Button, Card, Container, Flex, Heading, ScrollArea, Text, TextArea } from '@radix-ui/themes';
import { api } from '../../api/axios';
import UserAvatarLink from '../../components/user/UserAvatarLink';
import { extractApiErrorMessage } from '../../shared/apiError';
import { SendIcon, AlertTriangleIcon } from '../../components/common/Icons';

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
    <Container size="4" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Heading size="6" mb="4" style={{margin: '15px'}}>Чаты поддержки</Heading>

      <Flex gap="4" style={{ flex: 1, minHeight: 0 }}>
        {/* Users list */}
        <Card style={{ width: '280px', display: 'flex', flexDirection: 'column' }}>
          <ScrollArea>
            {userChats.length === 0 ? (
              <Text as="p" size="2" color="gray">Нет чатов</Text>
            ) : (
              userChats.map(chat => (
                <Flex
                  key={chat.userId}
                  onClick={() => setSelectedUserId(chat.userId)}
                  style={{
                    padding: '12px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    marginBottom: '4px',
                    backgroundColor: selectedUserId === chat.userId ? 'var(--gray-3)' : 'transparent',
                    transition: 'background-color 0.2s',
                  }}
                  gap="2"
                  align="center"
                >
                  <UserAvatarLink userId={chat.user.id} name={chat.user.name} email={chat.user.email} avatarUrl={chat.user.avatarUrl} size="1" />
                  <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
                    {/* <Text weight="medium" size="2" truncate>{chat.user.name || chat.user.email}</Text> */}
                    <Text size="1" color="gray" truncate>{chat.lastMessage?.text}</Text>
                  </Flex>
                </Flex>
              ))
            )}
          </ScrollArea>
        </Card>

        {/* Chat view */}
        <Card style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {!selectedChat ? (
            <Flex direction="column" align="center" justify="center" style={{ flex: 1 }}>
              <Text color="gray" align="center">Нет выбранного чата</Text>
            </Flex>
          ) : (
            <>
              {/* Chat header */}
              <Flex pb="3" style={{ borderBottom: '1px solid var(--gray-3)' }} align="center" gap="2">
                <UserAvatarLink userId={selectedChat.user.id} name={selectedChat.user.name} email={selectedChat.user.email} avatarUrl={selectedChat.user.avatarUrl} />
                <Flex direction="column">
                  {/* <Text weight="medium">{selectedChat.user.name || selectedChat.user.email}</Text> */}
                  <Text size="1" color="gray">{selectedChat.user.email}</Text>
                </Flex>
              </Flex>

              {/* Messages */}
              <ScrollArea style={{ flex: 1, marginBottom: '12px', minHeight: '300px', height: '500px' }}>
                {selectedMessages.length === 0 ? (
                  <Flex direction="column" align="center" justify="center" style={{ height: '300px', padding: '20px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}>
                      <AlertTriangleIcon width={48} height={48} />
                    </div>
                    <Heading size="4" align="center">Нет сообщений</Heading>
                    <Text color="gray" align="center" style={{ marginTop: '8px' }}>
                      Первое сообщение появится, когда клиент запустит чат поддержки
                    </Text>
                  </Flex>
                ) : (
                  <Flex direction="column" gap="3" p="3">
                    {selectedMessages.map((msg, idx) => {
                      const prevMsg = idx > 0 ? selectedMessages[idx - 1] : null;
                    //   const showSenderName = !prevMsg || prevMsg.senderId !== msg.senderId;
                      return (
                        <Flex
                          key={msg.id}
                          direction="column"
                          gap="1"
                          style={{
                            alignSelf: msg.sender.role === 'ADMIN' ? 'flex-end' : 'flex-start',
                            maxWidth: '60%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            backgroundColor: msg.sender.role === 'ADMIN' ? 'var(--accent-3)' : 'var(--gray-3)',
                          }}
                        >
                          {/* {showSenderName && (
                            <Text size="1" color={msg.sender.role === 'ADMIN' ? 'violet' : 'gray'}>
                              {msg.sender.name || (msg.sender.role === 'ADMIN' ? 'Админ' : 'Пользователь')}
                            </Text>
                          )} */}
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
              <Flex gap="2" style={{ borderTop: '1px solid var(--gray-a5)', paddingTop: '12px' }}>
                <TextArea
                  placeholder="Ответить..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  style={{ flex: 1, minHeight: 44, maxHeight: 120}}
                  disabled={sendingReply}
                />
                <Button
                  onClick={() => handleSendReply()}
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

      {error && (
        <Text color="red" as="p" mt="3">
          {error}
        </Text>
      )}
    </Container>
  );
}
