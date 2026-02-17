import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Container, Dialog, Flex, Grid, Heading, Text, TextArea, TextField } from '@radix-ui/themes';
import { api } from '../api/axios';
import AdCard, { type AdCardData } from '../components/ads/AdCard';
import UserAvatarLink from '../components/user/UserAvatarLink';
import { extractApiErrorMessage } from '../shared/apiError';
import { useAuthStore } from '../shared/authStore';

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
    <Container size="4">
      <Flex direction="column" gap="4">
        {error && <Text color="red">{error}</Text>}

        <Card>
          <Flex direction={{ initial: 'column', md: 'row' }} gap="4" justify="between">
            <Flex direction="column" gap="3" style={{ minWidth: 0 }}>
              <UserAvatarLink
                userId={user.id}
                name={user.name}
                email={user.email}
                avatarUrl={user.avatarUrl}
                subtitle={`На платформе с ${new Date(user.createdAt).toLocaleDateString()}`}
                size="3"
              />

              <Flex direction="column" gap="1">
                <Text size="2" color="gray">Контактная информация</Text>
                {user.phone && <Text size="2">Телефон: {user.phone}</Text>}
                {user.telegramUsername && <Text size="2">Telegram: @{user.telegramUsername}</Text>}
                {user.email && <Text size="2">Email: {user.email}</Text>}
                {!user.phone && !user.telegramUsername && !user.email && (
                  <Text size="2" color="gray">Контакты не указаны</Text>
                )}
              </Flex>
            </Flex>

            {!isSelfProfile && (
              <Flex direction="column" gap="2" style={{ minWidth: 220 }}>
                {authUser ? (
                  <>
                    <Button onClick={() => void startChat()} disabled={!chatAd}>
                      Написать
                    </Button>
                    {!chatAd && <Text size="1" color="gray">Нет объявлений для открытия чата</Text>}
                    <Button variant="soft" color="orange" onClick={() => setComplaintOpen(true)}>
                      Пожаловаться
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => navigate('/login')}>Войти, чтобы написать</Button>
                )}
              </Flex>
            )}
          </Flex>
        </Card>

        <Flex direction="column" gap="2">
          <Heading size="6">Объявления пользователя</Heading>
          {ads.length === 0 && <Text color="gray">Публичных объявлений пока нет.</Text>}
          <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="3">
            {ads.map((ad) => (
              <AdCard key={ad.id} ad={ad} showDescription />
            ))}
          </Grid>
        </Flex>
      </Flex>

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
    </Container>
  );
}
