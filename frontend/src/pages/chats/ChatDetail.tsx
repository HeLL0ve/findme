import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Button, Card, Container, Flex, Heading, Text, TextField } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { sendWs, subscribeWs } from '../../shared/wsClient';
import { useWsConnection } from '../../shared/useWsConnection';
import { extractApiErrorMessage } from '../../shared/apiError';

type Message = {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender?: {
    id: string;
    name?: string | null;
  };
};

type Chat = {
  id: string;
  ad: { id: string; petName?: string | null; type: string; status: string };
  user1: { id: string; name?: string | null; email: string };
  user2: { id: string; name?: string | null; email: string };
};

export default function ChatDetailPage() {
  const { id } = useParams();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useWsConnection();

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
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
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeWs((message) => {
      if (message?.type === 'chat:new' && message.chatId === id) {
        setMessages((prev) => [...prev, message.message]);
      }
    });
    sendWs({ type: 'chat:join', chatId: id });
    return unsubscribe;
  }, [id]);

  const title = useMemo(() => chat?.ad?.petName || 'Чат', [chat]);

  async function sendMessage() {
    if (!id || !input.trim()) return;

    const payload = { type: 'chat:send', chatId: id, content: input.trim() };
    const sentViaWs = sendWs(payload);

    if (!sentViaWs) {
      try {
        await api.post(`/chats/${id}/messages`, { content: input.trim() });
        const response = await api.get(`/chats/${id}/messages`);
        setMessages(response.data);
      } catch (err) {
        setError(extractApiErrorMessage(err, 'Не удалось отправить сообщение'));
      }
    }

    setInput('');
  }

  return (
    <Container size="3">
      <Flex direction="column" gap="4">
        <Heading size="7">{title}</Heading>
        {error && <Text color="red">{error}</Text>}

        <Card>
          <Flex direction="column" gap="3" style={{ maxHeight: 420, overflowY: 'auto' }}>
            {messages.map((message) => (
              <Box key={message.id} style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--accent-soft)' }}>
                <Text size="1" color="gray" style={{ marginBottom: 4 }}>
                  {message.sender?.name?.trim() || 'Пользователь'}
                </Text>
                <Text size="2">{message.content}</Text>
                <Text size="1" color="gray">{new Date(message.createdAt).toLocaleString()}</Text>
              </Box>
            ))}
            {messages.length === 0 && <Text color="gray">Сообщений пока нет</Text>}
          </Flex>
        </Card>

        <Flex gap="2">
          <TextField.Root
            placeholder="Введите сообщение..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            style={{ flex: 1 }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void sendMessage();
              }
            }}
          />
          <Button onClick={() => void sendMessage()}>Отправить</Button>
        </Flex>
      </Flex>
    </Container>
  );
}
