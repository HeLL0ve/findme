import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Badge, Button, Card, Container, Flex, Heading, Text, TextField, Section } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { SearchIcon, MessageIcon } from '../../components/common/Icons';
import { extractApiErrorMessage } from '../../shared/apiError';
import { useAuthStore } from '../../shared/authStore';
import { config } from '../../shared/config';
import { usePageTitle } from '../../shared/usePageTitle';

type Chat = {
  id: string;
  ad: { id: string; petName?: string | null; type: string; status: string; photos?: Array<{ photoUrl: string }> };
  user1Id: string;
  user2Id: string;
  user1: { id: string; name?: string | null; email: string; avatarUrl?: string | null };
  user2: { id: string; name?: string | null; email: string; avatarUrl?: string | null };
  messages: Array<{
    content: string;
    imageUrl?: string | null;
    createdAt: string;
    sender?: { id: string; name?: string | null };
  }>;
};

function resolveAvatarSrc(avatarUrl?: string | null) {
  if (!avatarUrl) return undefined;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  return `${config.apiUrl || ''}${avatarUrl}`;
}

export default function ChatsPage() {
  usePageTitle('Чаты');
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
      const haystack = [peer.name, peer.email, chat.ad.petName, chat.messages?.[0]?.content]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(value);
    });
  }, [chats, currentUser?.id, query]);

  return (
    <Flex direction="column" gap="0" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Header Section */}
      <Section size="2" style={{
        background: 'linear-gradient(135deg, var(--violet-2) 0%, var(--accent-soft) 100%)',
        borderBottom: '1px solid var(--gray-a5)',
      }}>
        <Container size="4">
          <Flex direction="column" gap="2">
            <Flex align="center" gap="2" justify="between">
              <Flex align="center" gap="2">
                <MessageIcon width={28} height={28} />
                <Heading size="7" weight="bold">Сообщения</Heading>
              </Flex>
              <Badge size="2" color="violet" style={{ fontWeight: 600 }}>
                {chats.length}
              </Badge>
            </Flex>
            <Text color="gray" size="2">
              Общайтесь с другими пользователями о потерянных и найденных питомцах
            </Text>
          </Flex>
        </Container>
      </Section>

      <Container size="4" style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-6)' }}>
        <Flex direction="column" gap="4">
          {/* Search */}
          <Card style={{
            border: '1px solid var(--gray-a7)',
            borderRadius: 'var(--radius-3)',
          }}>
            <TextField.Root
              placeholder="Поиск по имени, кличке или сообщениям..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              size="3"
            >
              <TextField.Slot>
                <SearchIcon width={18} height={18} />
              </TextField.Slot>
            </TextField.Root>
          </Card>

          {/* Error */}
          {error && (
            <Card style={{
              background: 'var(--red-2)',
              borderLeft: '3px solid var(--red-9)',
            }}>
              <Text color="red" size="2">{error}</Text>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <Flex direction="column" gap="3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card
                  key={i}
                  style={{
                    height: '96px',
                    background: 'var(--gray-a2)',
                    animation: 'pulse 2s infinite',
                    border: '1px solid var(--gray-a4)',
                  }}
                />
              ))}
            </Flex>
          )}

          {/* Empty State */}
          {!loading && filteredChats.length === 0 && (
            <Card style={{
              textAlign: 'center',
              padding: 'var(--space-6)',
              background: 'var(--gray-a2)',
            }}>
              <Flex direction="column" gap="3" align="center" justify="center">
                <MessageIcon width={64} height={64} color="var(--gray-9)" />
                <Heading size="4" color="gray">
                  {query ? 'Чатов не найдено' : 'У вас пока нет чатов'}
                </Heading>
                <Text color="gray" size="2">
                  {query
                    ? 'Попробуйте изменить параметры поиска'
                    : 'Начните общение, открыв объявление и написав автору'}
                </Text>
                {!query && (
                  <Button asChild variant="soft">
                    <Link to="/ads">Найти объявления</Link>
                  </Button>
                )}
              </Flex>
            </Card>
          )}

          {/* Chats List */}
          {!loading && filteredChats.length > 0 && (
            <Flex direction="column" gap="3">
              {filteredChats.map((chat) => {
                const peer = chat.user1.id === currentUser?.id ? chat.user2 : chat.user1;
                const last = chat.messages[0];
                const createdDate = last ? new Date(last.createdAt) : new Date();
                const isToday = createdDate.toDateString() === new Date().toDateString();
                const timeStr = isToday
                  ? createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : createdDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

                return (
                  <Link
                    to={`/chats/${chat.id}`}
                    key={chat.id}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <Card style={{
                      border: '1px solid var(--gray-a7)',
                      borderRadius: 'var(--radius-3)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }} onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = 'var(--violet-8)';
                      el.style.boxShadow = '0 2px 8px var(--shadow-2)';
                      el.style.transform = 'translateY(-2px)';
                    }} onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = 'var(--gray-a7)';
                      el.style.boxShadow = 'none';
                      el.style.transform = 'translateY(0)';
                    }}>
                      <Flex align="center" gap="3">
                        <Avatar
                          src={resolveAvatarSrc(peer.avatarUrl)}
                          fallback={(peer.name || peer.email).slice(0, 1).toUpperCase()}
                          radius="full"
                          size="5"
                          style={{ flexShrink: 0 }}
                        />

                        <Flex direction="column" style={{ flex: 1, minWidth: 0 }} gap="1">
                          <Flex align="center" justify="between" gap="2">
                            <Text weight="bold" size="3" className="truncate">
                              {peer.name || peer.email}
                            </Text>
                            <Text size="1" color="gray" style={{ flexShrink: 0 }}>
                              {timeStr}
                            </Text>
                          </Flex>

                          <Flex align="center" gap="2">
                            <Badge
                              size="1"
                              color={chat.ad.type === 'LOST' ? 'orange' : 'green'}
                              style={{ flexShrink: 0 }}
                            >
                              {chat.ad.type === 'LOST' ? 'Потерян' : 'Найден'}
                            </Badge>
                            <Text size="2" color="gray" className="truncate">
                              {chat.ad.petName || 'Без клички'}
                            </Text>
                          </Flex>

                          <Text size="2" color="gray" className="truncate" style={{ marginTop: '4px' }}>
                            {last
                              ? last.imageUrl
                                ? '📷 Изображение'
                                : last.content
                              : 'Сообщений пока нет'}
                          </Text>
                        </Flex>
                      </Flex>
                    </Card>
                  </Link>
                );
              })}
            </Flex>
          )}
        </Flex>
      </Container>

      <style>{`
        .truncate {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </Flex>
  );
}
