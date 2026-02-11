import { useEffect, useState } from 'react';
import { api } from '../../api/axios';
import { Badge, Button, Card, Container, Flex, Heading, Text } from '@radix-ui/themes';

type Ad = {
  id: string;
  petName?: string | null;
  animalType?: string | null;
  description: string;
  status: string;
  type: string;
  user?: { id: string; name?: string | null; email?: string };
};

export default function AdminAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/ads/pending');
        if (mounted) setAds(res.data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  async function moderate(id: string, status: 'APPROVED' | 'REJECTED' | 'ARCHIVED') {
    await api.post(`/ads/${id}/moderate`, { status });
    setAds((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <Container size="3">
      <Flex direction="column" gap="4">
        <Heading size="8">Модерация объявлений</Heading>
        {loading && <Text>Загрузка...</Text>}
        {!loading && ads.length === 0 && <Text color="gray">Нет объявлений для модерации.</Text>}
        <Flex direction="column" gap="3">
          {ads.map((ad) => (
            <Card key={ad.id}>
              <Flex direction="column" gap="2">
                <Flex justify="between" align="center">
                  <Text weight="bold">{ad.petName || 'Без имени'}</Text>
                  <Badge color="amber">PENDING</Badge>
                </Flex>
                <Text size="2" color="gray">{ad.animalType || 'Неизвестно'} • {ad.type}</Text>
                <Text size="2">{ad.description.slice(0, 140)}...</Text>
                <Flex gap="2">
                  <Button onClick={() => void moderate(ad.id, 'APPROVED')}>Одобрить</Button>
                  <Button variant="outline" onClick={() => void moderate(ad.id, 'REJECTED')}>Отклонить</Button>
                  <Button color="gray" variant="soft" onClick={() => void moderate(ad.id, 'ARCHIVED')}>В архив</Button>
                </Flex>
              </Flex>
            </Card>
          ))}
        </Flex>
      </Flex>
    </Container>
  );
}
