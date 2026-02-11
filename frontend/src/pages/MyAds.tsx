import { useEffect, useState } from 'react';
import { api } from '../api/axios';
import { Badge, Button, Card, Container, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { Link } from 'react-router-dom';

type Ad = {
  id: string;
  petName?: string | null;
  animalType?: string | null;
  status: string;
  type: 'LOST' | 'FOUND';
};

export default function MyAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/ads/my');
        if (mounted) setAds(res.data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  async function markFound(id: string) {
    await api.post(`/ads/${id}/found`);
    setAds((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'ARCHIVED' } : a)));
  }

  return (
    <Container size="3">
      <Flex direction="column" gap="4">
        <Heading size="8">Мои объявления</Heading>
        {loading && <Text>Загрузка...</Text>}
        {!loading && ads.length === 0 && <Text color="gray">У вас пока нет объявлений.</Text>}
        <Grid columns={{ initial: '1', md: '2' }} gap="3">
          {ads.map((ad) => (
            <Card key={ad.id}>
              <Flex direction="column" gap="2">
                <Flex justify="between" align="center">
                  <Text weight="bold">{ad.petName || 'Без имени'}</Text>
                  <Badge color={ad.status === 'APPROVED' ? 'blue' : 'gray'}>{ad.status}</Badge>
                </Flex>
                <Text size="2" color="gray">{ad.animalType || 'Неизвестно'}</Text>
                <Flex gap="2">
                  <Button asChild variant="soft">
                    <Link to={`/ads/${ad.id}`}>Открыть</Link>
                  </Button>
                  {ad.status !== 'ARCHIVED' && (
                    <Button variant="outline" onClick={() => void markFound(ad.id)}>
                      Отметить как найденного
                    </Button>
                  )}
                </Flex>
              </Flex>
            </Card>
          ))}
        </Grid>
      </Flex>
    </Container>
  );
}
