import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Container, Flex, Heading, Select, Text } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { adStatusLabel, adTypeLabel } from '../../shared/labels';
import { extractApiErrorMessage } from '../../shared/apiError';

type Ad = {
  id: string;
  petName?: string | null;
  animalType?: string | null;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  type: 'LOST' | 'FOUND';
  user?: { id: string; name?: string | null; email?: string };
};

export default function AdminAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | Ad['status']>('ALL');

  async function fetchAds() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/ads', { params: { take: 200 } });
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

  async function moderate(id: string, status: 'APPROVED' | 'REJECTED' | 'ARCHIVED') {
    try {
      await api.post(`/ads/${id}/moderate`, { status });
      setAds((prev) => prev.map((ad) => (ad.id === id ? { ...ad, status } : ad)));
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось обновить статус'));
    }
  }

  async function restoreFromArchive(id: string) {
    try {
      await api.patch(`/ads/${id}`, { status: 'APPROVED' });
      setAds((prev) => prev.map((ad) => (ad.id === id ? { ...ad, status: 'APPROVED' } : ad)));
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось восстановить объявление'));
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
                  <Text weight="bold">{ad.petName || 'Без клички'}</Text>
                  <Badge color={ad.status === 'APPROVED' ? 'blue' : ad.status === 'PENDING' ? 'amber' : 'gray'}>
                    {adStatusLabel(ad.status)}
                  </Badge>
                </Flex>

                <Text size="2" color="gray">
                  {[ad.animalType || 'Не указано', adTypeLabel(ad.type)].join(' · ')}
                </Text>
                <Text size="2" color="gray">Автор: {ad.user?.name || ad.user?.email || '—'}</Text>
                <Text size="2">{ad.description.length > 220 ? `${ad.description.slice(0, 220)}…` : ad.description}</Text>

                <Flex gap="2" wrap="wrap">
                  {ad.status === 'PENDING' && (
                    <>
                      <Button onClick={() => void moderate(ad.id, 'APPROVED')}>Одобрить</Button>
                      <Button variant="soft" color="red" onClick={() => void moderate(ad.id, 'REJECTED')}>Отклонить</Button>
                    </>
                  )}

                  {ad.status === 'APPROVED' && (
                    <Button variant="soft" color="gray" onClick={() => void moderate(ad.id, 'ARCHIVED')}>
                      В архив
                    </Button>
                  )}

                  {ad.status === 'ARCHIVED' && (
                    <Button variant="outline" onClick={() => void restoreFromArchive(ad.id)}>
                      Достать из архива
                    </Button>
                  )}
                </Flex>
              </Flex>
            </Card>
          ))}
        </Flex>
      </Flex>
    </Container>
  );
}
