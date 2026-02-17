import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Container, Flex, Heading, Text } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { adStatusLabel } from '../../shared/labels';
import { extractApiErrorMessage } from '../../shared/apiError';

type Chat = {
  id: string;
  ad: { id: string; petName?: string | null; type: string; status: string };
  user1: { id: string; name?: string | null; email: string };
  user2: { id: string; name?: string | null; email: string };
  messages: Array<{ content: string; createdAt: string; sender?: { id: string; name?: string | null } }>;
};

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await api.get('/chats');
        if (!mounted) return;
        setChats(response.data);
      } catch (err) {
        if (!mounted) return;
        setError(extractApiErrorMessage(err, 'Не удалось загрузить чаты'));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Container size="3">
      <Flex direction="column" gap="4">
        <Heading size="8">Чаты</Heading>
        {loading && <Text>Загрузка...</Text>}
        {error && <Text color="red">{error}</Text>}
        {!loading && !error && chats.length === 0 && <Text color="gray">У вас пока нет чатов.</Text>}
        <Flex direction="column" gap="3">
          {chats.map((chat) => (
            <Card key={chat.id} asChild>
              <Link to={`/chats/${chat.id}`} style={{ textDecoration: 'none' }}>
                <Flex direction="column" gap="1">
                  <Text weight="bold">{chat.ad?.petName || 'Объявление'}</Text>
                  <Text size="2" color="gray">Статус: {adStatusLabel(chat.ad?.status)}</Text>
                  <Text size="2" color="gray">
                    Последнее сообщение: {(chat.messages?.[0]?.sender?.name || 'Пользователь')}: {chat.messages?.[0]?.content || '—'}
                  </Text>
                </Flex>
              </Link>
            </Card>
          ))}
        </Flex>
      </Flex>
    </Container>
  );
}
