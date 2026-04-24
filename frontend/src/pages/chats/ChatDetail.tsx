import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar, Button, Card, Container, Dialog, DropdownMenu, Flex, Text, TextArea, Section } from '@radix-ui/themes';
import { MoreIcon, SendIcon, AddIcon } from '../../components/common/Icons';
import { api } from '../../api/axios';
import { extractApiErrorMessage } from '../../shared/apiError';
import { useAuthStore } from '../../shared/authStore';
import { config } from '../../shared/config';
import { useWsConnection } from '../../shared/useWsConnection';
import { sendWs, subscribeWs } from '../../shared/wsClient';
import { usePageTitle } from '../../shared/usePageTitle';

type Message = {
  id: string;
  content: string;
  imageUrl?: string | null;
  senderId: string;
  createdAt: string;
  editedAt?: string | null;
  isRead?: boolean;
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Message | null>(null);
  const [editText, setEditText] = useState('');
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  usePageTitle(chat?.ad?.petName ? `Чат — ${chat.ad.petName}` : 'Чат');

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
      if (msg?.type === 'chat:typing' && msg.chatId === id) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          if (msg.isTyping) {
            next.add(msg.userId);
          } else {
            next.delete(msg.userId);
          }
          return next;
        });
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

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendWs({ type: 'chat:typing', chatId: id, isTyping: false });

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

  function handleInputChange(value: string) {
    setInput(value);

    if (!id) return;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim()) {
      sendWs({ type: 'chat:typing', chatId: id, isTyping: true });
      typingTimeoutRef.current = setTimeout(() => {
        sendWs({ type: 'chat:typing', chatId: id, isTyping: false });
      }, 3000);
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    if (!file.type.startsWith('image/')) {
      setError('Можно отправлять только изображения');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Размер файла не должен превышать 5 МБ');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post(`/chats/${id}/messages/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessages((prev) => [...prev, response.data]);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось отправить изображение'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
      setDeleteMessageId(null);
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

  if (!chat)
    return (
      <Container size="4" style={{ paddingTop: 'var(--space-6)' }}>
        <Text>{error || 'Загрузка...'}</Text>
      </Container>
    );

  return (
    <Flex direction="column" gap="0" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <Section size="2" style={{
        background: 'linear-gradient(135deg, var(--violet-2) 0%, var(--accent-soft) 100%)',
        borderBottom: '1px solid var(--gray-a5)',
      }}>
        <Container size="4">
          <Flex align="center" justify="between" gap="3">
            <Flex align="center" gap="3" style={{ minWidth: 0, flex: 1 }}>
              <Button
                variant="ghost"
                size="2"
                onClick={() => navigate('/chats')}
                style={{ flexShrink: 0 }}
              >
                ←
              </Button>
              <Link
                to={peer?.id ? `/users/${peer.id}` : '#'}
                style={{ textDecoration: 'none', minWidth: 0, flex: 1 }}
              >
                <Flex align="center" gap="2" style={{ minWidth: 0 }}>
                  <Avatar
                    src={resolveAvatarSrc(peer?.avatarUrl)}
                    fallback={(peer?.name || peer?.email || 'U').slice(0, 1).toUpperCase()}
                    radius="full"
                    size="4"
                    style={{ flexShrink: 0 }}
                  />
                  <Flex direction="column" style={{ minWidth: 0 }}>
                    <Text weight="bold" size="3" className="truncate">
                      {peer?.name || peer?.email || 'Пользователь'}
                    </Text>
                    <Text size="1" color="gray" className="truncate">
                      {chat.ad.petName || 'Объявление'}
                    </Text>
                  </Flex>
                </Flex>
              </Link>
            </Flex>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button variant="ghost" size="2" style={{ flexShrink: 0 }}>
                  <MoreIcon width={20} height={20} />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                <DropdownMenu.Item onClick={deleteChat} color="red">
                  Удалить чат
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </Flex>
        </Container>
      </Section>

      <Container size="4" style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)', flex: 1 }}>
        <Flex direction="column" gap="4" style={{ height: '100%' }}>
          {error && (
            <Card style={{
              background: 'var(--red-2)',
              borderLeft: '3px solid var(--red-9)',
            }}>
              <Text color="red" size="2">{error}</Text>
            </Card>
          )}

          <Card style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid var(--gray-a7)',
            borderRadius: 'var(--radius-3)',
          }}>
            <Flex
              direction="column"
              gap="3"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 'var(--space-4)',
              }}
            >
              {messages.map((message) => {
                const mine = message.senderId === currentUser?.id;
                const editable = mine && canEditMessage(message.createdAt);

                return (
                  <Flex
                    key={message.id}
                    justify={mine ? 'end' : 'start'}
                    style={{ width: '100%' }}
                  >
                    <Flex
                      direction="column"
                      gap="1"
                      style={{
                        maxWidth: '70%',
                        background: mine ? 'var(--violet-9)' : 'var(--gray-a3)',
                        color: mine ? 'white' : 'inherit',
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-3)',
                        boxShadow: '0 1px 3px var(--shadow-1)',
                        position: 'relative',
                      }}
                    >

                      {!mine && (
                        <Text size="1" weight="bold" style={{ color: 'var(--violet-11)' }}>
                          {message.sender?.name || 'Собеседник'}
                        </Text>
                      )}
                      {message.imageUrl && (
                        <img
                          src={`${config.apiUrl || ''}${message.imageUrl}`}
                          alt="Изображение"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '300px',
                            borderRadius: 'var(--radius-2)',
                            cursor: 'pointer',
                            objectFit: 'contain',
                          }}
                          onClick={() => window.open(`${config.apiUrl || ''}${message.imageUrl}`, '_blank')}
                        />
                      )}
                      {message.content && message.content !== '[Изображение]' && (
                        <Text size="2" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {message.content}
                        </Text>
                      )}
                      <Flex align="center" justify="between" gap="2">
                        <Text size="1" style={{ color: mine ? 'rgba(255, 255, 255, 0.7)' : 'var(--gray-10)' }}>
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {message.editedAt ? ' · изменено' : ''}
                        </Text>

                        {mine && (
                          <DropdownMenu.Root>
                            <DropdownMenu.Trigger>
                              <button
                                type="button"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                <MoreIcon width={14} height={14} />
                              </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content align="end">
                              {editable && (
                                <DropdownMenu.Item onClick={() => openEditDialog(message)}>
                                  Редактировать
                                </DropdownMenu.Item>
                              )}
                              <DropdownMenu.Item color="red" onClick={() => setDeleteMessageId(message.id)}>
                                Удалить
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu.Root>
                        )}
                      </Flex>
                    </Flex>
                  </Flex>
                );
              })}

              {messages.length === 0 && (
                <Flex align="center" justify="center" style={{ flex: 1 }}>
                  <Text color="gray">Сообщений пока нет</Text>
                </Flex>
              )}

              {typingUsers.size > 0 && (
                <Flex justify="start">
                  <Text size="2" color="gray" style={{ fontStyle: 'italic', padding: 'var(--space-2)' }}>
                    {peer?.name || 'Собеседник'} печатает...
                  </Text>
                </Flex>
              )}

              <div ref={bottomRef} />
            </Flex>
          </Card>

          <Card style={{
            border: '1px solid var(--gray-a7)',
            borderRadius: 'var(--radius-3)',
          }}>
            <Flex align="end" gap="2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <Button
                variant="soft"
                size="3"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ flexShrink: 0 }}
              >
                <AddIcon width={20} height={20} />
              </Button>
              <TextArea
                placeholder={uploading ? 'Отправка...' : 'Введите сообщение...'}
                value={input}
                onChange={(event) => handleInputChange(event.target.value)}
                disabled={uploading}
                style={{ flex: 1, minHeight: '44px', maxHeight: '120px', resize: 'none' }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
              />
              <Button
                size="3"
                onClick={() => void sendMessage()}
                disabled={!input.trim() || uploading}
                style={{ flexShrink: 0 }}
              >
                <SendIcon width={20} height={20} />
              </Button>
            </Flex>
          </Card>
        </Flex>
      </Container>

      <Dialog.Root open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <Dialog.Content maxWidth="500px">
          <Dialog.Title>Редактировать сообщение</Dialog.Title>
          <Flex direction="column" gap="3" mt="3">
            <TextArea
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              placeholder="Новый текст"
              style={{ minHeight: '80px' }}
            />
            <Flex justify="end" gap="2">
              <Dialog.Close>
                <Button variant="soft" type="button">
                  Отмена
                </Button>
              </Dialog.Close>
              <Button type="button" onClick={() => void saveMessageEdit()}>
                Сохранить
              </Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      <Dialog.Root open={!!deleteMessageId} onOpenChange={(open) => !open && setDeleteMessageId(null)}>
        <Dialog.Content maxWidth="420px">
          <Dialog.Title>Удалить сообщение?</Dialog.Title>
          <Dialog.Description>Действие нельзя отменить.</Dialog.Description>
          <Flex justify="end" gap="2" mt="3">
            <Dialog.Close>
              <Button variant="soft" type="button">
                Отмена
              </Button>
            </Dialog.Close>
            <Button
              color="red"
              type="button"
              onClick={() => deleteMessageId && void deleteMessage(deleteMessageId)}
            >
              Удалить
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      <style>{`
        .truncate {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </Flex>
  );
}
