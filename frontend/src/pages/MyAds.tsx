import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Container, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { api } from '../api/axios';
import AdCard, { type AdCardData } from '../components/ads/AdCard';
import ConfirmActionDialog from '../components/common/ConfirmActionDialog';
import { extractApiErrorMessage } from '../shared/apiError';

type Ad = AdCardData;

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
    <Container size="4">
      <Flex direction="column" gap="4">
        <Heading size="8">Мои объявления</Heading>

        {loading && <Text>Загрузка...</Text>}
        {error && <Text color="red">{error}</Text>}
        {!loading && !error && ads.length === 0 && (
          <Text color="gray">У вас пока нет объявлений.</Text>
        )}

        <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="3">
          {ads.map((ad) => (
            <AdCard
              key={ad.id}
              ad={ad}
              showDescription
              actions={(
                <>
                  <Button asChild size="1" variant="outline">
                    <Link to={`/ads/${ad.id}`}>Открыть</Link>
                  </Button>
                  <Button asChild variant="soft" size="1">
                    <Link to={`/my-ads/${ad.id}/edit`}>Редактировать</Link>
                  </Button>
                  {ad.status !== 'ARCHIVED' && (
                    <ConfirmActionDialog
                      title="Переместить объявление в архив?"
                      description="Объявление перестанет отображаться в активном поиске."
                      confirmText="В архив"
                      color="orange"
                      onConfirm={() => moveToArchive(ad.id)}
                      trigger={<Button size="1" variant="soft" color="gray">В архив</Button>}
                    />
                  )}
                </>
              )}
            />
          ))}
        </Grid>
      </Flex>
    </Container>
  );
}
