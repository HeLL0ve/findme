import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Button, Card, Container, Flex, Heading, Text, TextField } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { useAuthStore } from '../../shared/authStore';
import { extractApiErrorMessage } from '../../shared/apiError';
import { config } from '../../shared/config';

type Chat = {
  id: string;
  ad: { id: string; petName?: string | null; type: string; status: string; photos?: Array<{ photoUrl: string }> };
  user1Id: string;
  user2Id: string;
  user1: { id: string; name?: string | null; email: string; avatarUrl?: string | null };
  user2: { id: string; name?: string | null; email: string; avatarUrl?: string | null };
  messages: Array<{ content: string; createdAt: string; sender?: { id: string; name?: string | null } }>;
};

function resolveAvatarSrc(avatarUrl?: string | null) {
  if (!avatarUrl) return undefined;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  return `${config.apiUrl || ''}${avatarUrl}`;
}

export default function ChatsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);

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

  const filteredChats = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return chats;
    return chats.filter((chat) => {
      const peer = chat.user1.id === currentUser?.id ? chat.user2 : chat.user1;
      const haystack = [peer.name, peer.email, chat.ad.petName, chat.messages?.[0]?.content].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(value);
    });
  }, [chats, currentUser?.id, query]);

  async function deleteChat(chatId: string) {
    if (!window.confirm('Удалить чат для обоих участников?')) return;

    try {
      await api.delete(`/chats/${chatId}`);
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось удалить чат'));
    }
  }

  return (
    <Container size="4">
      <Flex direction="column" gap="4">
        <Heading size="8">Чаты</Heading>
        <Card className="chat-shell" style={{ padding: 0 }}>
          <Flex direction="column" style={{ height: '72vh' }}>
            <BoxHeader query={query} setQuery={setQuery} />

            <div style={{ overflowY: 'auto', padding: 10 }}>
              {loading && <Text>Загрузка...</Text>}
              {error && <Text color="red">{error}</Text>}
              {!loading && !error && filteredChats.length === 0 && (
                <Text color="gray">У вас пока нет чатов.</Text>
              )}

              <Flex direction="column" gap="2">
                {filteredChats.map((chat) => {
                  const peer = chat.user1.id === currentUser?.id ? chat.user2 : chat.user1;
                  const last = chat.messages[0];

                  return (
                    <Card key={chat.id} style={{ padding: 10 }}>
                      <Flex align="center" justify="between" gap="2">
                        <Link to={`/chats/${chat.id}`} style={{ flex: 1, minWidth: 0 }}>
                          <Flex align="center" gap="2" style={{ minWidth: 0 }}>
                            <Avatar
                              src={resolveAvatarSrc(peer.avatarUrl)}
                              fallback={(peer.name || peer.email).slice(0, 1).toUpperCase()}
                              radius="full"
                            />
                            <Flex direction="column" style={{ minWidth: 0, flex: 1 }}>
                              <Text weight="bold" className="truncate">{peer.name || peer.email}</Text>
                              <Text size="2" color="gray" className="truncate">
                                {chat.ad.petName ? `Объявление: ${chat.ad.petName}` : 'Объявление без клички'}
                              </Text>
                              <Text size="2" color="gray" className="truncate">
                                {last?.sender?.name ? `${last.sender.name}: ` : ''}{last?.content || 'Сообщений пока нет'}
                              </Text>
                            </Flex>
                            {last && (
                              <Text size="1" color="gray">
                                {new Date(last.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Text>
                            )}
                          </Flex>
                        </Link>
                        <Button size="1" variant="soft" color="red" onClick={() => void deleteChat(chat.id)}>
                          Удалить
                        </Button>
                      </Flex>
                    </Card>
                  );
                })}
              </Flex>
            </div>
          </Flex>
        </Card>
      </Flex>
    </Container>
  );
}

function BoxHeader({ query, setQuery }: { query: string; setQuery: (value: string) => void }) {
  return (
    <Flex align="center" justify="between" gap="2" style={{ padding: 12, borderBottom: '1px solid var(--gray-a5)' }}>
      <TextField.Root
        placeholder="Поиск по чатам"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
    </Flex>
  );
}
