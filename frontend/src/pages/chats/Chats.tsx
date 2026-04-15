import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Button, Card, Container, Flex, Heading, Text, TextField, Box, Section, Badge } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { SearchIcon, MessageIcon, DeleteIcon } from '../../components/common/Icons';
import ConfirmActionDialog from '../../components/common/ConfirmActionDialog';
import { extractApiErrorMessage } from '../../shared/apiError';
import { useAuthStore } from '../../shared/authStore';
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
      const haystack = [peer.name, peer.email, chat.ad.petName, chat.messages?.[0]?.content]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(value);
    });
  }, [chats, currentUser?.id, query]);

  async function deleteChat(chatId: string) {
    try {
      await api.delete(`/chats/${chatId}`);
      setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось удалить чат'));
    }
  }

  return (
    <Flex direction="column" gap="0">
      {/* Header */}
      <Section size="2" style={{
        background: 'linear-gradient(135deg, var(--violet-2) 0%, var(--accent-soft) 100%)',
        borderBottom: '1px solid var(--gray-a5)',
      }}>
        <Container size="4">
          <Flex align="center" gap="2">
            <MessageIcon width={28} height={28} />
            <Heading size="7" weight="bold">Мои сообщения</Heading>
          </Flex>
          <Text color="gray" size="2">Общайтесь с другими пользователями о потерянных и найденных питомцах</Text>
        </Container>
      </Section>

      <Container size="4" style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-6)' }}>
        <Flex direction="column" gap="4" style={{ minHeight: 'calc(100vh - 280px)' }}>
          {/* Search & Stats */}
          <Flex gap="3" direction={{ initial: 'column', lg: 'row' }} align={{ initial: 'stretch', lg: 'end' }}>
            <Flex direction="column" gap="2" style={{ flex: 1 }}>
              <Flex align="center" gap="2">
                <SearchIcon width={16} height={16} />
                <Text size="2" weight="bold" color="gray">Поиск в чатах</Text>
              </Flex>
              <TextField.Root
                placeholder="Поиск по имени, email, названию питомца..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </Flex>
            <Card style={{
              background: 'var(--violet-a2)',
              border: '1px solid var(--violet-a6)',
              padding: 'var(--space-3)',
              minWidth: '140px',
              flexShrink: 0,
            }}>
              <Flex direction="row" gap="1" align="center" style={{height: '8px'}}>
                <Text size="2" weight="bold">{chats.length}</Text>
                <Text size="1" color="gray">чатов</Text>
              </Flex>
            </Card>
          </Flex>

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
            <Flex direction="column" gap="2">
              {[1, 2, 3].map((i) => (
                <Card key={i} style={{
                  height: '80px',
                  background: 'var(--gray-a2)',
                  animation: 'pulse 2s infinite',
                }}>
                  <Box style={{ height: '100%' }} />
                </Card>
              ))}
            </Flex>
          )}

          {/* Empty State */}
          {!loading && filteredChats.length === 0 && (
            <Card style={{
              background: 'var(--gray-a2)',
              textAlign: 'center',
              padding: 'var(--space-6)',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Flex direction="column" gap="3" align="center">
                <MessageIcon width={48} height={48} />
                <Heading size="4" color="gray">
                  {query ? 'Чатов не найдено' : 'У вас пока нет чатов'}
                </Heading>
                <Text color="gray" size="2">
                  {query
                    ? 'Попробуйте изменить параметры поиска'
                    : 'Начните общение, открыв объявление и нажав "Написать сообщение"'}
                </Text>
                <Button asChild>
                  <Link to="/ads" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><SearchIcon width={16} height={16} />Найти объявления</Link>
                </Button>
              </Flex>
            </Card>
          )}

          {/* Chats List */}
          {!loading && filteredChats.length > 0 && (
            <Flex direction="column" gap="2">
              {filteredChats.map((chat) => {
                const peer = chat.user1.id === currentUser?.id ? chat.user2 : chat.user1;
                const last = chat.messages[0];
                const createdDate = last
                  ? new Date(last.createdAt)
                  : new Date();
                const isToday = createdDate.toDateString() === new Date().toDateString();
                const timeStr = isToday
                  ? createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : createdDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

                return (
                  <Link to={`/chats/${chat.id}`} key={chat.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Card style={{
                      padding: 'var(--space-3)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                    }} onMouseEnter={(e) => {
                      const card = e.currentTarget as HTMLElement;
                      card.style.transform = 'translateX(4px)';
                      card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                    }} onMouseLeave={(e) => {
                      const card = e.currentTarget as HTMLElement;
                      card.style.transform = 'translateX(0)';
                      card.style.boxShadow = '';
                    }}>
                      <Flex justify="between" align="start" gap="3">
                        <Flex align="center" gap="3" style={{ flex: 1, minWidth: 0 }}>
                          <Avatar
                            src={resolveAvatarSrc(peer.avatarUrl)}
                            fallback={(peer.name || peer.email).slice(0, 1).toUpperCase()}
                            radius="full"
                            size="5"
                          />

                          <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
                            {/* User Name */}
                            <Text weight="bold" size="2" className="truncate">
                              {peer.name || peer.email}
                            </Text>

                            {/* Ad Info */}
                            <Flex gap="2" align="center" style={{ marginTop: 'var(--space-1)' }}>
                              <Badge size="1" color={chat.ad.type === 'LOST' ? 'orange' : 'green'}>
                                {chat.ad.type === 'LOST' ? 'Потерян' : 'Найден'}
                              </Badge>
                              <Text size="1" color="gray" className="truncate">
                                {chat.ad.petName || 'Объявление без клички'}
                              </Text>
                            </Flex>

                            {/* Last Message */}
                            <Text size="2" color="gray" className="truncate" style={{ marginTop: 'var(--space-1)' }}>
                              {last?.sender?.name ? `${last.sender.name}: ` : ''}
                              {last?.content || 'Сообщений пока нет'}
                            </Text>
                          </Flex>
                        </Flex>

                        {/* Time & Delete */}
                        <Flex direction="column" align="end" gap="2" style={{ flexShrink: 0 }}>
                          <Text size="1" color="gray">{timeStr}</Text>
                          <ConfirmActionDialog
                            title="Удалить чат?"
                            description="Чат удалится у обоих участников и все сообщения будут потеряны."
                            confirmText="Удалить"
                            color="red"
                            onConfirm={() => deleteChat(chat.id)}
                            trigger={
                              <Button
                                size="1"
                                variant="soft"
                                color="red"
                                onClick={(e) => e.preventDefault()}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <DeleteIcon width={14} height={14} />
                                Удалить
                              </Button>
                            }
                          />
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
          0%, 100% {
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
