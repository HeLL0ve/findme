import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Container, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { api } from '../api/axios';
import { extractApiErrorMessage } from '../shared/apiError';
import { adStatusLabel, adTypeLabel } from '../shared/labels';
import { config } from '../shared/config';

type Ad = {
  id: string;
  petName?: string | null;
  animalType?: string | null;
  breed?: string | null;
  status: string;
  type: 'LOST' | 'FOUND';
  photos?: Array<{ photoUrl: string }>;
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

  async function moveToArchive(adId: string) {
    try {
      await api.post(`/ads/${adId}/found`);
      setAds((prev) => prev.map((ad) => (ad.id === adId ? { ...ad, status: 'ARCHIVED' } : ad)));
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось изменить статус'));
    }
  }

  return (
    <Container size="3">
      <Flex direction="column" gap="4">
        <Heading size="8">Мои объявления</Heading>

        {loading && <Text>Загрузка...</Text>}
        {error && <Text color="red">{error}</Text>}
        {!loading && !error && ads.length === 0 && (
          <Text color="gray">У вас пока нет объявлений.</Text>
        )}

        <Grid columns={{ initial: '1', md: '2' }} gap="3">
          {ads.map((ad) => {
            const preview = ad.photos?.[0]?.photoUrl;
            const previewSrc = preview ? (preview.startsWith('http') ? preview : `${config.apiUrl || ''}${preview}`) : null;

            return (
              <Card key={ad.id}>
                <Flex gap="3" align="center">
                  <div
                    style={{
                      width: 120,
                      height: 80,
                      borderRadius: 12,
                      background: 'var(--accent-soft)',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {previewSrc && (
                      <img
                        src={previewSrc}
                        alt="preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                  <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
                    <Text weight="bold" className="truncate">{ad.petName || 'Без клички'}</Text>
                    <Text size="2" color="gray" className="truncate">
                      {[ad.animalType || 'Не указано', ad.breed || null].filter(Boolean).join(' · ')}
                    </Text>
                    <Flex gap="2" wrap="wrap">
                      <Badge color={ad.type === 'LOST' ? 'orange' : 'green'}>{adTypeLabel(ad.type)}</Badge>
                      <Badge color={ad.status === 'APPROVED' ? 'blue' : 'gray'}>{adStatusLabel(ad.status)}</Badge>
                    </Flex>
                    <Flex gap="2" wrap="wrap" mt="1">
                      <Button asChild size="1" variant="outline">
                        <Link to={`/ads/${ad.id}`}>Открыть</Link>
                      </Button>
                      <Button asChild variant="soft" size="1">
                        <Link to={`/my-ads/${ad.id}/edit`}>Редактировать</Link>
                      </Button>
                      {ad.status !== 'ARCHIVED' && (
                        <Button
                          size="1"
                          variant="soft"
                          color="gray"
                          onClick={() => void moveToArchive(ad.id)}
                        >
                          В архив
                        </Button>
                      )}
                    </Flex>
                  </Flex>
                </Flex>
              </Card>
            );
          })}
        </Grid>
      </Flex>
    </Container>
  );
}
