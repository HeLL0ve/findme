import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, Container, Dialog, Flex, Heading, Text, TextArea, TextField } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { config } from '../../shared/config';
import { useAuthStore } from '../../shared/authStore';
import { extractApiErrorMessage } from '../../shared/apiError';
import { adStatusLabel, adTypeLabel } from '../../shared/labels';

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
  user?: {
    id: string;
    name?: string | null;
    email?: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
  location?: {
    address?: string | null;
    city?: string | null;
    latitude?: number;
    longitude?: number;
  } | null;
  photos?: Array<{ photoUrl: string }>;
};

type ComplaintTarget = {
  type: 'AD' | 'USER';
  targetId: string;
  title: string;
} | null;

export default function AdDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [ad, setAd] = useState<Ad | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [complaintTarget, setComplaintTarget] = useState<ComplaintTarget>(null);
  const [complaintReason, setComplaintReason] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        const response = await api.get(`/ads/${id}`);
        if (!mounted) return;
        setAd(response.data);
      } catch (err) {
        if (!mounted) return;
        setError(extractApiErrorMessage(err, 'Ошибка загрузки объявления'));
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  async function startChat() {
    if (!id) return;
    try {
      const response = await api.post('/chats', { adId: id });
      navigate(`/chats/${response.data.id}`);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось создать чат'));
    }
  }

  async function moveToArchive() {
    if (!id) return;
    try {
      await api.post(`/ads/${id}/found`);
      setAd((prev) => (prev ? { ...prev, status: 'ARCHIVED' } : prev));
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось изменить статус'));
    }
  }

  async function submitComplaint() {
    if (!complaintTarget) return;
    if (complaintReason.trim().length < 5) {
      setError('Причина жалобы должна быть не менее 5 символов');
      return;
    }

    setComplaintSubmitting(true);
    setError(null);
    try {
      await api.post('/complaints', {
        targetType: complaintTarget.type,
        targetId: complaintTarget.targetId,
        reason: complaintReason,
        description: complaintDescription || undefined,
      });
      setComplaintTarget(null);
      setComplaintReason('');
      setComplaintDescription('');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось отправить жалобу'));
    } finally {
      setComplaintSubmitting(false);
    }
  }

  if (error && !ad) return <Container size="3"><Text color="red">{error}</Text></Container>;
  if (!ad) return <Container size="3"><Text>Загрузка...</Text></Container>;

  const isOwner = user?.id === ad.userId;
  const canComplain = !!user && !isOwner;

  return (
    <Container size="3">
      <Flex direction="column" gap="4">
        {error && <Text color="red">{error}</Text>}
        <Card>
          <Flex direction={{ initial: 'column', md: 'row' }} gap="4">
            <Flex direction="column" gap="3" style={{ flex: 1 }}>
              <Heading size="8" className="truncate">{ad.petName || 'Питомец'}</Heading>
              <Text color="gray" className="truncate">
                {[ad.animalType || 'Не указано', ad.breed || null, ad.color ? `окрас: ${ad.color}` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>

              <Flex gap="2" wrap="wrap">
                <Badge color={ad.type === 'LOST' ? 'orange' : 'green'}>{adTypeLabel(ad.type)}</Badge>
                <Badge color={ad.status === 'APPROVED' ? 'blue' : 'gray'}>{adStatusLabel(ad.status)}</Badge>
              </Flex>

              <Text>{ad.description}</Text>

              {ad.location && (
                <Card variant="surface">
                  <Heading size="4">Местоположение</Heading>
                  <Text size="2" color="gray">{ad.location.city || 'Город не указан'}</Text>
                  <Text size="2">{ad.location.address || 'Адрес не указан'}</Text>
                </Card>
              )}
            </Flex>

            <Flex direction="column" gap="3" style={{ minWidth: 270 }}>
              <Card>
                <Text color="gray">Контакты</Text>
                <Text weight="bold" className="truncate">{ad.user?.name || ad.user?.email}</Text>
                {ad.user?.phone && <Text size="2">{ad.user.phone}</Text>}
              </Card>

              <Flex direction="column" gap="2">
                {!isOwner && user && <Button onClick={() => void startChat()}>Написать</Button>}
                {isOwner && ad.status !== 'ARCHIVED' && (
                  <Button variant="outline" onClick={() => void moveToArchive()}>Переместить в архив</Button>
                )}
                {!user && <Button onClick={() => navigate('/login')}>Войти для связи</Button>}

                {canComplain && (
                  <>
                    <Button
                      color="orange"
                      variant="soft"
                      onClick={() => setComplaintTarget({ type: 'AD', targetId: ad.id, title: 'Жалоба на объявление' })}
                    >
                      Пожаловаться на объявление
                    </Button>
                    {ad.user?.id && (
                      <Button
                        color="orange"
                        variant="outline"
                        onClick={() =>
                          setComplaintTarget({ type: 'USER', targetId: ad.user!.id, title: 'Жалоба на пользователя' })
                        }
                      >
                        Пожаловаться на пользователя
                      </Button>
                    )}
                  </>
                )}
              </Flex>
            </Flex>
          </Flex>
        </Card>

        {ad.photos && ad.photos.length > 0 && (
          <Card>
            <Heading size="5">Фотографии</Heading>
            <Flex gap="2" wrap="wrap" style={{ marginTop: 8 }}>
              {ad.photos.map((photo, index) => {
                const src = photo.photoUrl.startsWith('http') ? photo.photoUrl : `${config.apiUrl || ''}${photo.photoUrl}`;
                return (
                  <img
                    key={`${photo.photoUrl}-${index}`}
                    src={src}
                    alt={`photo-${index}`}
                    style={{ width: 140, height: 100, objectFit: 'cover', borderRadius: 10 }}
                  />
                );
              })}
            </Flex>
          </Card>
        )}
      </Flex>

      <Dialog.Root open={!!complaintTarget} onOpenChange={(open) => !open && setComplaintTarget(null)}>
        <Dialog.Content maxWidth="560px">
          <Dialog.Title>{complaintTarget?.title || 'Жалоба'}</Dialog.Title>
          <Dialog.Description size="2" mb="3">
            Опишите проблему. Жалоба попадет в админ-панель на модерацию.
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
          </Flex>

          <Flex gap="3" justify="end" mt="4">
            <Dialog.Close>
              <Button variant="soft" type="button">Отмена</Button>
            </Dialog.Close>
            <Button type="button" onClick={() => void submitComplaint()} disabled={complaintSubmitting}>
              {complaintSubmitting ? 'Отправка...' : 'Отправить'}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Container>
  );
}
