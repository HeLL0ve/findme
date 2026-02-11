import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/axios';
import { Box, Button, Card, Container, Flex, Heading, Text, TextField } from '@radix-ui/themes';
import { sendWs, subscribeWs } from '../../shared/wsClient';
import { useWsConnection } from '../../shared/useWsConnection';

type Message = {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
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

  useWsConnection();

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      const [chatRes, msgsRes] = await Promise.all([
        api.get(`/chats/${id}`),
        api.get(`/chats/${id}/messages`),
      ]);
      if (!mounted) return;
      setChat(chatRes.data);
      setMessages(msgsRes.data);
    })();
    return () => { mounted = false };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeWs((msg) => {
      if (msg?.type === 'chat:new' && msg.chatId === id) {
        setMessages((prev) => [...prev, msg.message]);
      }
    });
    sendWs({ type: 'chat:join', chatId: id });
    return unsub;
  }, [id]);

  const title = useMemo(() => chat?.ad?.petName || 'Чат', [chat]);

  async function sendMessage() {
    if (!id || !input.trim()) return;
    const payload = { type: 'chat:send', chatId: id, content: input.trim() };
    const sent = sendWs(payload);
    if (!sent) {
      await api.post(`/chats/${id}/messages`, { content: input.trim() });
      const res = await api.get(`/chats/${id}/messages`);
      setMessages(res.data);
    }
    setInput('');
  }

  return (
    <Container size="3">
      <Flex direction="column" gap="4">
        <Heading size="7">{title}</Heading>
        <Card>
          <Flex direction="column" gap="3" style={{ maxHeight: 420, overflowY: 'auto' }}>
            {messages.map((m) => (
              <Box key={m.id} style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--accent-3)' }}>
                <Text size="2">{m.content}</Text>
                <Text size="1" color="gray">{new Date(m.createdAt).toLocaleString()}</Text>
              </Box>
            ))}
            {messages.length === 0 && <Text color="gray">Сообщений пока нет</Text>}
          </Flex>
        </Card>

        <Flex gap="2">
          <TextField.Root
            placeholder="Введите сообщение..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button onClick={() => void sendMessage()}>Отправить</Button>
        </Flex>
      </Flex>
    </Container>
  );
}
