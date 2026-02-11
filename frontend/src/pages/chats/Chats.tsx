import { useEffect, useState } from 'react';
import { api } from '../../api/axios';
import { Card, Container, Flex, Heading, Text } from '@radix-ui/themes';
import { Link } from 'react-router-dom';

type Chat = {
  id: string;
  ad: { id: string; petName?: string | null; type: string; status: string };
  user1: { id: string; name?: string | null; email: string };
  user2: { id: string; name?: string | null; email: string };
  messages: Array<{ content: string; createdAt: string }>;
};

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/chats');
        if (mounted) setChats(res.data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  return (
    <Container size="3">
      <Flex direction="column" gap="4">
        <Heading size="8">Чаты</Heading>
        {loading && <Text>Загрузка...</Text>}
        {!loading && chats.length === 0 && <Text color="gray">У вас пока нет чатов.</Text>}
        <Flex direction="column" gap="3">
          {chats.map((chat) => (
            <Card key={chat.id} asChild>
              <Link to={`/chats/${chat.id}`} style={{ textDecoration: 'none' }}>
                <Flex direction="column" gap="1">
                  <Text weight="bold">{chat.ad?.petName || 'Объявление'}</Text>
                  <Text size="2" color="gray">Статус: {chat.ad?.status}</Text>
                  <Text size="2" color="gray">
                    Последнее сообщение: {chat.messages?.[0]?.content || '—'}
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
