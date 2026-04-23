import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Container, Dialog, Flex, Grid, Heading, Text, TextArea, TextField } from '@radix-ui/themes';
import { api } from '../api/axios';
import AdCard, { type AdCardData } from '../components/ads/AdCard';
import UserAvatarLink from '../components/user/UserAvatarLink';
import { extractApiErrorMessage } from '../shared/apiError';
import { useAuthStore } from '../shared/authStore';
import { UserIcon, DescriptionIcon, PhoneIcon, MailIcon, MessageIcon, AlertTriangleIcon } from '../components/common/Icons';

type PublicUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  telegramUsername?: string | null;
  createdAt: string;
};

type PublicAd = AdCardData;

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [ads, setAds] = useState<PublicAd[]>([]);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintReason, setComplaintReason] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);

  const isSelfProfile = !!authUser && authUser.id === id;

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        const response = await api.get(`/users/${id}/public`);
        if (!mounted) return;
        setUser(response.data.user);
        setAds(response.data.ads || []);
      } catch (err) {
        if (!mounted) return;
        setError(extractApiErrorMessage(err, 'Не удалось загрузить профиль пользователя'));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  const chatAd = useMemo(() => {
    if (ads.length === 0) return null;
    return ads.find((ad) => ad.status === 'APPROVED') || ads[0];
  }, [ads]);

  async function startChat() {
    if (!chatAd) return;
    try {
      const response = await api.post('/chats', { adId: chatAd.id });
      navigate(`/chats/${response.data.id}`);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось открыть чат с пользователем'));
    }
  }

  async function submitComplaint() {
    if (!user) return;
    if (complaintReason.trim().length < 5) {
      setError('Причина жалобы должна быть не менее 5 символов');
      return;
    }

    setComplaintSubmitting(true);
    setError(null);
    try {
      await api.post('/complaints', {
        targetType: 'USER',
        targetId: user.id,
        reason: complaintReason.trim(),
        description: complaintDescription.trim() || undefined,
      });
      setComplaintOpen(false);
      setComplaintReason('');
      setComplaintDescription('');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось отправить жалобу'));
    } finally {
      setComplaintSubmitting(false);
    }
  }

  if (loading) return <Container size="4"><Text>Загрузка...</Text></Container>;
  if (error && !user) return <Container size="4"><Text color="red">{error}</Text></Container>;
  if (!user) return <Container size="4"><Text color="red">Профиль не найден</Text></Container>;

  return (
    <Flex direction="column" gap="0">
      {/* Header */}
      <Flex direction="column" gap="2" style={{
        background: 'linear-gradient(135deg, var(--violet-2) 0%, var(--accent-soft) 100%)',
        borderBottom: '1px solid var(--gray-a5)',
        padding: 'var(--space-4)',
      }}>
        <Container size="4">
          <Flex gap="2" align="center">
            <UserIcon width={28} height={28} />
            <Heading size="7" weight="bold">Профиль пользователя</Heading>
          </Flex>
          <Text color="gray" size="2">Информация и объявления пользователя</Text>
        </Container>
      </Flex>

      <Container size="4" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-6)' }}>
        <Flex direction={{ initial: 'column', md: 'row' }} gap="6">
          {/* Left Column - User Info */}
          <Flex direction="column" gap="4" style={{ flex: 1 }}>
            {error && (
              <Card style={{
                background: 'var(--red-2)',
                borderLeft: '3px solid var(--red-9)',
              }}>
                <Text color="red" size="2">{error}</Text>
              </Card>
            )}

            {/* User Info Card */}
            <Card style={{
              border: '1px solid var(--gray-a7)',
              borderRadius: 'var(--radius-3)',
            }}>
              <Flex direction="column" gap="4">
                <Flex gap="2" align="center">
                  <UserIcon width={20} height={20} color="var(--violet-10)" />
                  <Heading size="4" weight="bold">О пользователе</Heading>
                </Flex>

                <UserAvatarLink
                  userId={user.id}
                  name={user.name}
                  email={user.email}
                  avatarUrl={user.avatarUrl}
                  subtitle={`На платформе с ${new Date(user.createdAt).toLocaleDateString('ru-RU')}`}
                  size="3"
                />
              </Flex>
            </Card>

            {/* Contact Info Card */}
            {(user.phone || user.email || user.telegramUsername) && (
              <Card style={{
                background: 'var(--green-a1)',
                border: '1px solid var(--green-a6)',
                borderRadius: 'var(--radius-3)',
              }}>
                <Flex direction="column" gap="4">
                  <Flex gap="2" align="center">
                    <PhoneIcon width={20} height={20} color="var(--green-10)" />
                    <Heading size="4" weight="bold">Контакты</Heading>
                  </Flex>

                  <Flex direction="column" gap="3">
                    {user.phone && (
                      <Flex gap="2" align="center">
                        <PhoneIcon width={18} height={18} color="var(--green-10)" />
                        <a href={`tel:${user.phone}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <Text size="2" style={{ wordBreak: 'break-all', color: 'var(--blue-11)', cursor: 'pointer' }}>
                            {user.phone}
                          </Text>
                        </a>
                      </Flex>
                    )}
                    {user.email && (
                      <Flex gap="2" align="center">
                        <MailIcon width={18} height={18} color="var(--green-10)" />
                        <a href={`mailto:${user.email}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <Text size="2" style={{ wordBreak: 'break-all', color: 'var(--blue-11)', cursor: 'pointer' }}>
                            {user.email}
                          </Text>
                        </a>
                      </Flex>
                    )}
                    {user.telegramUsername && (
                      <Flex gap="2" align="center">
                        <MessageIcon width={18} height={18} color="var(--green-10)" />
                        <a href={`https://t.me/${user.telegramUsername}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                          <Text size="2" style={{ wordBreak: 'break-all', color: 'var(--blue-11)', cursor: 'pointer' }}>
                            @{user.telegramUsername}
                          </Text>
                        </a>
                      </Flex>
                    )}
                  </Flex>
                </Flex>
              </Card>
            )}
          </Flex>

          {/* Right Column - Actions & Ads */}
          <Flex direction="column" gap="4" style={{ flex: 1, minWidth: '280px' }}>
            {!isSelfProfile && (
              <Card style={{
                background: 'var(--violet-a1)',
                border: '1px solid var(--violet-a6)',
                borderRadius: 'var(--radius-3)',
              }}>
                <Flex direction="column" gap="3">
                  {authUser ? (
                    <>
                      <Button
                        onClick={() => void startChat()}
                        disabled={!chatAd}
                        size="3"
                        style={{ width: '100%', fontWeight: 600, cursor: 'pointer' }}
                      >
                        <Flex align="center" gap="2"><MessageIcon width={16} height={16} />Написать сообщение</Flex>
                      </Button>
                      {!chatAd && (
                        <Text size="1" color="gray" style={{ textAlign: 'center' }}>
                          Нет активных объявлений для открытия чата
                        </Text>
                      )}
                      <Button
                        variant="soft"
                        color="orange"
                        onClick={() => setComplaintOpen(true)}
                        size="2"
                        style={{ width: '100%', fontWeight: 600, cursor: 'pointer' }}
                      >
                        <Flex align="center" gap="2"><AlertTriangleIcon width={16} height={16} />Пожаловаться</Flex>
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => navigate('/login')}
                      size="3"
                      style={{ width: '100%', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Войти для связи
                    </Button>
                  )}
                </Flex>
              </Card>
            )}

            {/* Ads Section */}
            <Card style={{
              border: '1px solid var(--gray-a7)',
              borderRadius: 'var(--radius-3)',
            }}>
              <Flex direction="column" gap="4">
                <Flex gap="2" align="center">
                  <DescriptionIcon width={20} height={20} color="var(--blue-10)" />
                  <Heading size="4" weight="bold">Объявления ({ads.length})</Heading>
                </Flex>

                {ads.length === 0 ? (
                  <Card style={{
                    background: 'var(--gray-a2)',
                    textAlign: 'center',
                    padding: 'var(--space-4)',
                  }}>
                    <Flex direction="column" gap="3" align="center" justify="center">
                      <DescriptionIcon width={32} height={32} color="var(--gray-9)" />
                      <Text size="2" color="gray">Публичных объявлений пока нет</Text>
                    </Flex>
                  </Card>
                ) : (
                  <Grid columns={{ initial: '1' }} gap="3">
                    {ads.map((ad) => (
                      <AdCard key={ad.id} ad={ad} showDescription={false} />
                    ))}
                  </Grid>
                )}
              </Flex>
            </Card>
          </Flex>
        </Flex>
      </Container>

      {/* Complaint Dialog */}
      <Dialog.Root open={complaintOpen} onOpenChange={setComplaintOpen}>
        <Dialog.Content maxWidth="560px">
          <Dialog.Title>Жалоба на пользователя</Dialog.Title>
          <Dialog.Description size="2" mb="3">
            Опишите причину жалобы. Она попадет в админ-панель на рассмотрение.
          </Dialog.Description>
          <Flex direction="column" gap="3">
            <TextField.Root
              placeholder="Причина жалобы"
              value={complaintReason}
              onChange={(event) => setComplaintReason(event.target.value)}
            />
            <TextArea
              placeholder="Дополнительное описание (необязательно)"
              value={complaintDescription}
              onChange={(event) => setComplaintDescription(event.target.value)}
            />
            <Flex justify="end" gap="2">
              <Dialog.Close>
                <Button variant="soft" type="button">Отмена</Button>
              </Dialog.Close>
              <Button type="button" disabled={complaintSubmitting} onClick={() => void submitComplaint()}>
                {complaintSubmitting ? 'Отправка...' : 'Отправить'}
              </Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Flex>
  );
}
