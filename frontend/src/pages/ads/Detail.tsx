import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import { config } from '../../shared/config';
import { Badge, Button, Card, Container, Flex, Heading, Text } from '@radix-ui/themes';
import { useAuthStore } from '../../shared/authStore';

type Ad = {
  id: string;
  petName?: string | null;
  animalType?: string | null;
  breed?: string | null;
  color?: string | null;
  description: string;
  status: string;
  type: 'LOST' | 'FOUND';
  userId: string;
  user?: { id: string; name?: string | null; email?: string; phone?: string | null };
  location?: { address?: string | null; city?: string | null; latitude?: number; longitude?: number } | null;
  photos?: Array<{ photoUrl: string }>;
};

export default function AdDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ad, setAd] = useState<Ad | null>(null);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get(`/ads/${id}`);
        if (!mounted) return;
        setAd(res.data);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Ошибка загрузки');
      }
    })();
    return () => { mounted = false };
  }, [id]);

  async function startChat() {
    if (!id) return;
    const res = await api.post('/chats', { adId: id });
    navigate(`/chats/${res.data.id}`);
  }

  async function markFound() {
    if (!id) return;
    await api.post(`/ads/${id}/found`);
    setAd((prev) => (prev ? { ...prev, status: 'ARCHIVED' } : prev));
  }

  if (error) return <Container size="3"><Text color="red">{error}</Text></Container>;
  if (!ad) return <Container size="3"><Text>Загрузка...</Text></Container>;

  const isOwner = user?.id === ad.userId;

  return (
    <Container size="3">
      <Flex direction="column" gap="4">
        <Card>
          <Flex direction={{ initial: 'column', md: 'row' }} gap="4">
            <Flex direction="column" gap="3" style={{ flex: 1 }}>
              <Heading size="8">{ad.petName || 'Питомец'}</Heading>
              <Text color="gray">
                {ad.animalType || 'Неизвестно'} {ad.breed ? `• ${ad.breed}` : ''} {ad.color ? `• ${ad.color}` : ''}
              </Text>
              <Flex gap="2">
                <Badge color={ad.type === 'LOST' ? 'red' : 'green'}>{ad.type}</Badge>
                <Badge color={ad.status === 'APPROVED' ? 'blue' : 'gray'}>{ad.status}</Badge>
              </Flex>
              <Text>{ad.description}</Text>

              {ad.location && (
                <Card variant="surface">
                  <Heading size="4">Местоположение</Heading>
                  <Text size="2" color="gray">{ad.location.city || ''}</Text>
                  <Text size="2">{ad.location.address || 'Адрес не указан'}</Text>
                </Card>
              )}
            </Flex>

            <Flex direction="column" gap="3" style={{ minWidth: 260 }}>
              <Card>
                <Text color="gray">Контакты</Text>
                <Text weight="bold">{ad.user?.name || ad.user?.email}</Text>
                {ad.user?.phone && <Text size="2">{ad.user.phone}</Text>}
              </Card>
              <Flex direction="column" gap="2">
                {!isOwner && user && (
                  <Button onClick={() => void startChat()}>Написать</Button>
                )}
                {isOwner && ad.status !== 'ARCHIVED' && (
                  <Button variant="outline" onClick={() => void markFound()}>
                    Отметить как найденного
                  </Button>
                )}
                {!user && (
                  <Button onClick={() => navigate('/login')}>Войти для общения</Button>
                )}
              </Flex>
            </Flex>
          </Flex>
        </Card>

        {ad.photos && ad.photos.length > 0 && (
          <Card>
            <Heading size="5">Фотографии</Heading>
            <Flex gap="2" wrap="wrap" style={{ marginTop: 8 }}>
              {ad.photos.map((p, i) => {
                const src = p.photoUrl?.startsWith('http') ? p.photoUrl : `${config.apiUrl}${p.photoUrl}`;
                return (
                <img
                  key={`${p.photoUrl}-${i}`}
                  src={src}
                  alt={`photo-${i}`}
                  style={{ width: 140, height: 100, objectFit: 'cover', borderRadius: 10 }}
                />
                );
              })}
            </Flex>
          </Card>
        )}
      </Flex>
    </Container>
  );
}
