import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar, Button, Card, Container, Dialog, DropdownMenu, Flex, Text, TextArea, TextField } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { sendWs, subscribeWs } from '../../shared/wsClient';
import { useWsConnection } from '../../shared/useWsConnection';
import { extractApiErrorMessage } from '../../shared/apiError';
import { useAuthStore } from '../../shared/authStore';
import { config } from '../../shared/config';

type Message = {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  editedAt?: string | null;
  sender?: {
    id: string;
    name?: string | null;
  };
};

type Chat = {
  id: string;
  ad: { id: string; petName?: string | null; type: string; status: string };
  user1: { id: string; name?: string | null; email: string; avatarUrl?: string | null };
  user2: { id: string; name?: string | null; email: string; avatarUrl?: string | null };
};

const EDIT_WINDOW_MINUTES = 15;

function resolveAvatarSrc(avatarUrl?: string | null) {
  if (!avatarUrl) return undefined;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  return `${config.apiUrl || ''}${avatarUrl}`;
}

function canEditMessage(createdAt: string) {
  const ms = Date.now() - new Date(createdAt).getTime();
  return ms <= EDIT_WINDOW_MINUTES * 60 * 1000;
}

export default function ChatDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Message | null>(null);
  const [editText, setEditText] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useWsConnection();

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    async function load() {
      try {
        const [chatResponse, messagesResponse] = await Promise.all([
          api.get(`/chats/${id}`),
          api.get(`/chats/${id}/messages`),
        ]);
        if (!mounted) return;
        setChat(chatResponse.data);
        setMessages(messagesResponse.data);
      } catch (err) {
        if (!mounted) return;
        setError(extractApiErrorMessage(err, 'Не удалось загрузить чат'));
      }
    }

    void load();
    const interval = setInterval(() => void load(), 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeWs((msg) => {
      if (msg?.type === 'chat:new' && msg.chatId === id) {
        setMessages((prev) => [...prev, msg.message]);
      }
    });
    sendWs({ type: 'chat:join', chatId: id });
    return unsubscribe;
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const peer = useMemo(() => {
    if (!chat || !currentUser) return null;
    return chat.user1.id === currentUser.id ? chat.user2 : chat.user1;
  }, [chat, currentUser]);

  async function sendMessage() {
    if (!id || !input.trim()) return;
    setError(null);

    const payload = { type: 'chat:send', chatId: id, content: input.trim() };
    const sentViaWs = sendWs(payload);
    if (!sentViaWs) {
      try {
        const response = await api.post(`/chats/${id}/messages`, { content: input.trim() });
        setMessages((prev) => [...prev, response.data]);
      } catch (err) {
        setError(extractApiErrorMessage(err, 'Не удалось отправить сообщение'));
        return;
      }
    }
    setInput('');
  }

  async function deleteChat() {
    if (!id) return;
    try {
      await api.delete(`/chats/${id}`);
      navigate('/chats');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось удалить чат'));
    }
  }

  async function deleteMessage(messageId: string) {
    if (!id) return;
    try {
      await api.delete(`/chats/${id}/messages/${messageId}`);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось удалить сообщение'));
    }
  }

  function openEditDialog(message: Message) {
    setEditTarget(message);
    setEditText(message.content);
  }

  async function saveMessageEdit() {
    if (!id || !editTarget) return;
    if (!editText.trim()) {
      setError('Текст сообщения не может быть пустым');
      return;
    }
    try {
      const response = await api.patch(`/chats/${id}/messages/${editTarget.id}`, {
        content: editText.trim(),
      });
      setMessages((prev) => prev.map((msg) => (msg.id === editTarget.id ? response.data : msg)));
      setEditTarget(null);
      setEditText('');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось изменить сообщение'));
    }
  }

  if (!chat) return <Container size="4"><Text>{error || 'Загрузка...'}</Text></Container>;

  return (
    <Container size="4">
      <Card className="chat-shell" style={{ padding: 0 }}>
        <Flex direction="column" style={{ height: '78vh' }}>
          <Flex align="center" justify="between" gap="2" style={{ padding: 12, borderBottom: '1px solid var(--gray-a5)' }}>
            <Flex align="center" gap="2" style={{ minWidth: 0 }}>
              <Avatar
                src={resolveAvatarSrc(peer?.avatarUrl)}
                fallback={(peer?.name || peer?.email || 'U').slice(0, 1).toUpperCase()}
                radius="full"
              />
              <Flex direction="column" style={{ minWidth: 0 }}>
                <Text weight="bold" className="truncate">{peer?.name || peer?.email || 'Пользователь'}</Text>
                <Text size="2" color="gray" className="truncate">
                  {chat.ad.petName ? `По объявлению: ${chat.ad.petName}` : 'Чат по объявлению'}
                </Text>
              </Flex>
            </Flex>

            <Flex gap="2">
              <Button variant="soft" color="gray" onClick={() => setDeleteDialogOpen(true)}>
                Удалить чат
              </Button>
            </Flex>
          </Flex>

          {error && (
            <Flex style={{ padding: '6px 12px' }}>
              <Text color="red">{error}</Text>
            </Flex>
          )}

          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            <Flex direction="column" gap="2">
              {messages.map((message) => {
                const mine = message.senderId === currentUser?.id;
                const editable = mine && canEditMessage(message.createdAt);

                return (
                  <div key={message.id} className={`chat-message ${mine ? 'mine' : 'other'}`}>
                    {!mine && (
                      <Text size="1" color="gray" style={{ marginBottom: 4 }}>
                        {message.sender?.name || 'Собеседник'}
                      </Text>
                    )}
                    <Text style={{ whiteSpace: 'pre-wrap' }}>{message.content}</Text>
                    <Flex align="center" justify="between" gap="2" mt="1">
                      <Text size="1" color={mine ? 'gray' : 'gray'}>
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {message.editedAt ? ' · изменено' : ''}
                      </Text>

                      {mine && (
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger>
                            <Button size="1" variant="ghost">⋯</Button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Content align="end">
                            {editable && (
                              <DropdownMenu.Item onClick={() => openEditDialog(message)}>
                                Редактировать
                              </DropdownMenu.Item>
                            )}
                            <DropdownMenu.Item color="red" onClick={() => void deleteMessage(message.id)}>
                              Удалить
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Root>
                      )}
                    </Flex>
                  </div>
                );
              })}
              {messages.length === 0 && <Text color="gray">Сообщений пока нет</Text>}
              <div ref={bottomRef} />
            </Flex>
          </div>

          <Flex align="end" gap="2" style={{ padding: 12, borderTop: '1px solid var(--gray-a5)' }}>
            <TextArea
              placeholder="Введите сообщение..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              style={{ flex: 1, minHeight: 44 }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <Button onClick={() => void sendMessage()}>Отправить</Button>
          </Flex>
        </Flex>
      </Card>

      <Dialog.Root open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <Dialog.Content maxWidth="500px">
          <Dialog.Title>Редактировать сообщение</Dialog.Title>
          <Flex direction="column" gap="3">
            <TextField.Root
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              placeholder="Новый текст"
            />
            <Flex justify="end" gap="2">
              <Dialog.Close>
                <Button variant="soft" type="button">Отмена</Button>
              </Dialog.Close>
              <Button type="button" onClick={() => void saveMessageEdit()}>Сохранить</Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      <Dialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <Dialog.Content maxWidth="420px">
          <Dialog.Title>Удалить чат</Dialog.Title>
          <Dialog.Description>
            Чат будет удален у обоих участников. Действие нельзя отменить.
          </Dialog.Description>
          <Flex justify="end" gap="2" mt="3">
            <Dialog.Close>
              <Button variant="soft" type="button">Отмена</Button>
            </Dialog.Close>
            <Button color="red" type="button" onClick={() => void deleteChat()}>Удалить</Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Container>
  );
}
