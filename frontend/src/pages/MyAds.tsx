import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Container, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { api } from '../api/axios';
import { extractApiErrorMessage } from '../shared/apiError';
import { adStatusLabel, adTypeLabel } from '../shared/labels';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await api.get('/ads/my');
        if (!mounted) return;
        setAds(response.data);
      } catch (err) {
        if (!mounted) return;
        setError(extractApiErrorMessage(err, 'Не удалось загрузить объявления'));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function markFound(id: string) {
    try {
      await api.post(`/ads/${id}/found`);
      setAds((prev) => prev.map((ad) => (ad.id === id ? { ...ad, status: 'ARCHIVED' } : ad)));
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось изменить статус'));
    }
  }

  return (
    <Container size="3">
      <Flex direction="column" gap="4">
        <Heading size="8">Мои объявления</Heading>

        {loading && <Text>Загрузка...</Text>}
        {!loading && !error && ads.length === 0 && <Text color="gray">У вас пока нет объявлений.</Text>}
        {error && <Text color="red">{error}</Text>}

        <Grid columns={{ initial: '1', md: '2' }} gap="3">
          {ads.map((ad) => (
            <Card key={ad.id}>
              <Flex direction="column" gap="2">
                <Flex justify="between" align="center" gap="2" wrap="wrap">
                  <Text weight="bold">{ad.petName || 'Без клички'}</Text>
                  <Badge color={ad.status === 'APPROVED' ? 'blue' : 'gray'}>{adStatusLabel(ad.status)}</Badge>
                </Flex>
                <Text size="2" color="gray">{ad.animalType || 'Не указано'} · {adTypeLabel(ad.type)}</Text>
                <Flex gap="2" wrap="wrap">
                  <Button asChild variant="soft">
                    <Link to={`/ads/${ad.id}`}>Открыть</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to={`/my-ads/${ad.id}/edit`}>Редактировать</Link>
                  </Button>
                  {ad.status !== 'ARCHIVED' && (
                    <Button variant="soft" color="gray" onClick={() => void markFound(ad.id)}>
                      В архив
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
