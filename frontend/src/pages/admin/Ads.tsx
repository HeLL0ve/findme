import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Container, Dialog, Flex, Heading, Select, Text, TextArea } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { api } from '../../api/axios';
import ConfirmActionDialog from '../../components/common/ConfirmActionDialog';
import UserAvatarLink from '../../components/user/UserAvatarLink';
import { extractApiErrorMessage } from '../../shared/apiError';
import { adStatusLabel, adTypeLabel } from '../../shared/labels';

type Ad = {
  id: string;
  petName?: string | null;
  animalType?: string | null;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  type: 'LOST' | 'FOUND';
  user?: { id: string; name?: string | null; email?: string; avatarUrl?: string | null };
};

export default function AdminAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | Ad['status']>('ALL');
  const [rejectTarget, setRejectTarget] = useState<Ad | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  async function fetchAds() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/ads', { params: { take: 300 } });
      setAds(response.data);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось загрузить объявления'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchAds();
  }, []);

  const filteredAds = useMemo(
    () => (statusFilter === 'ALL' ? ads : ads.filter((ad) => ad.status === statusFilter)),
    [ads, statusFilter],
  );

  async function moderate(id: string, status: 'APPROVED' | 'ARCHIVED') {
    try {
      const response = await api.post(`/ads/${id}/moderate`, { status });
      const updated = response.data as Ad;
      setAds((prev) => prev.map((ad) => (ad.id === id ? { ...ad, status: updated.status } : ad)));
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось обновить статус'));
    }
  }

  async function restoreFromArchive(id: string) {
    try {
      const response = await api.patch(`/ads/${id}`, { status: 'APPROVED' });
      const updated = response.data as Ad;
      setAds((prev) => prev.map((ad) => (ad.id === id ? { ...ad, status: updated.status } : ad)));
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось восстановить объявление'));
    }
  }

  async function rejectAd() {
    if (!rejectTarget) return;
    if (rejectReason.trim().length < 5) {
      setError('Укажите причину отклонения (минимум 5 символов)');
      return;
    }

    setRejectLoading(true);
    setError(null);
    try {
      const response = await api.post(`/ads/${rejectTarget.id}/moderate`, {
        status: 'REJECTED',
        reason: rejectReason.trim(),
      });

      if (response.data?.deleted) {
        setAds((prev) => prev.filter((ad) => ad.id !== rejectTarget.id));
      }

      setRejectReason('');
      setRejectTarget(null);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось отклонить объявление'));
    } finally {
      setRejectLoading(false);
    }
  }

  return (
    <Container size="3">
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center" wrap="wrap" gap="2">
          <Heading size="8">Объявления в админке</Heading>
          <Flex align="center" gap="2">
            <Select.Root value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'ALL' | Ad['status'])}>
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="ALL">Все статусы</Select.Item>
                <Select.Item value="PENDING">На модерации</Select.Item>
                <Select.Item value="APPROVED">Опубликовано</Select.Item>
                <Select.Item value="REJECTED">Отклонено</Select.Item>
                <Select.Item value="ARCHIVED">Архив</Select.Item>
              </Select.Content>
            </Select.Root>
            <Button variant="soft" onClick={() => void fetchAds()}>Обновить</Button>
          </Flex>
        </Flex>

        {loading && <Text>Загрузка...</Text>}
        {error && <Text color="red">{error}</Text>}
        {!loading && filteredAds.length === 0 && <Text color="gray">Ничего не найдено.</Text>}

        <Flex direction="column" gap="3">
          {filteredAds.map((ad) => (
            <Card key={ad.id}>
              <Flex direction="column" gap="2">
                <Flex justify="between" align="center" wrap="wrap" gap="2">
                  <Link to={`/ads/${ad.id}`} style={{ minWidth: 0 }}>
                    <Text weight="bold" className="truncate">{ad.petName || 'Без клички'}</Text>
                  </Link>
                  <Badge color={ad.status === 'APPROVED' ? 'blue' : ad.status === 'PENDING' ? 'amber' : 'gray'}>
                    {adStatusLabel(ad.status)}
                  </Badge>
                </Flex>

                <Text size="2" color="gray">
                  {[ad.animalType || 'Не указано', adTypeLabel(ad.type)].join(' · ')}
                </Text>

                {ad.user?.id ? (
                  <UserAvatarLink
                    userId={ad.user.id}
                    name={ad.user.name}
                    email={ad.user.email}
                    avatarUrl={ad.user.avatarUrl}
                    subtitle="Автор объявления"
                  />
                ) : (
                  <Text size="2" color="gray">Автор: —</Text>
                )}

                <Text size="2" className="truncate-2">
                  {ad.description}
                </Text>

                <Flex gap="2" wrap="wrap">
                  {ad.status === 'PENDING' && (
                    <>
                      <ConfirmActionDialog
                        title="Одобрить объявление?"
                        description="После одобрения объявление появится в общем списке."
                        confirmText="Одобрить"
                        color="violet"
                        onConfirm={() => moderate(ad.id, 'APPROVED')}
                        trigger={<Button>Одобрить</Button>}
                      />
                      <Button variant="soft" color="red" onClick={() => setRejectTarget(ad)}>
                        Отклонить
                      </Button>
                    </>
                  )}

                  {ad.status === 'APPROVED' && (
                    <ConfirmActionDialog
                      title="Отправить объявление в архив?"
                      description="Пользователи больше не увидят его в активных объявлениях."
                      confirmText="В архив"
                      color="orange"
                      onConfirm={() => moderate(ad.id, 'ARCHIVED')}
                      trigger={<Button variant="soft" color="gray">В архив</Button>}
                    />
                  )}

                  {ad.status === 'ARCHIVED' && (
                    <ConfirmActionDialog
                      title="Вернуть объявление из архива?"
                      description="Объявление снова станет активным."
                      confirmText="Восстановить"
                      color="violet"
                      onConfirm={() => restoreFromArchive(ad.id)}
                      trigger={<Button variant="outline">Достать из архива</Button>}
                    />
                  )}
                </Flex>
              </Flex>
            </Card>
          ))}
        </Flex>
      </Flex>

      <Dialog.Root open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <Dialog.Content maxWidth="560px">
          <Dialog.Title>Отклонить объявление</Dialog.Title>
          <Dialog.Description size="2" mb="3">
            Укажите причину отклонения. Объявление будет удалено, а автор получит уведомление.
          </Dialog.Description>
          <Flex direction="column" gap="3">
            <TextArea
              placeholder="Причина отклонения"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
            />
            <Flex justify="end" gap="2">
              <Dialog.Close>
                <Button variant="soft" type="button">Отмена</Button>
              </Dialog.Close>
              <Button color="red" type="button" disabled={rejectLoading} onClick={() => void rejectAd()}>
                {rejectLoading ? 'Сохранение...' : 'Отклонить и удалить'}
              </Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Container>
  );
}
