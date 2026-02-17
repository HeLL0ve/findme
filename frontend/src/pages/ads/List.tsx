import { useEffect, useState } from 'react';
import { Button, Card, Container, Flex, Grid, Heading, Select, Text, TextField } from '@radix-ui/themes';
import { api } from '../../api/axios';
import AdCard, { type AdCardData } from '../../components/ads/AdCard';
import { extractApiErrorMessage } from '../../shared/apiError';
import AdsMap from '../../shared/AdsMap';

type Ad = AdCardData & {
  location?: {
    latitude?: number | null;
    longitude?: number | null;
    address?: string | null;
    city?: string | null;
  } | null;
};

type Filters = {
  q: string;
  city: string;
  type: 'ALL' | 'LOST' | 'FOUND';
  status: 'APPROVED' | 'ARCHIVED';
};

export default function AdsList() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    q: '',
    city: '',
    type: 'ALL',
    status: 'APPROVED',
  });

  async function fetchAds() {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { status: filters.status };
      if (filters.q.trim()) params.q = filters.q.trim();
      if (filters.city.trim()) params.city = filters.city.trim();
      if (filters.type !== 'ALL') params.type = filters.type;

      const response = await api.get('/ads', { params });
      setAds(response.data);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось загрузить объявления'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchAds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container size="4">
      <Flex direction="column" gap="4">
        <Heading size="8">Объявления</Heading>

        <Card>
          <Grid columns={{ initial: '1', md: '5' }} gap="3" align="center">
            <TextField.Root
              placeholder="Кличка, описание, порода"
              value={filters.q}
              onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
            />
            <TextField.Root
              placeholder="Город"
              value={filters.city}
              onChange={(event) => setFilters((prev) => ({ ...prev, city: event.target.value }))}
            />
            <Select.Root value={filters.type} onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value as Filters['type'] }))}>
              <Select.Trigger placeholder="Тип" />
              <Select.Content>
                <Select.Item value="ALL">Все типы</Select.Item>
                <Select.Item value="LOST">Потерян</Select.Item>
                <Select.Item value="FOUND">Найден</Select.Item>
              </Select.Content>
            </Select.Root>
            <Select.Root value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value as Filters['status'] }))}>
              <Select.Trigger placeholder="Статус" />
              <Select.Content>
                <Select.Item value="APPROVED">Опубликовано</Select.Item>
                <Select.Item value="ARCHIVED">В архиве</Select.Item>
              </Select.Content>
            </Select.Root>
            <Button onClick={() => void fetchAds()} disabled={loading}>
              {loading ? 'Загрузка...' : 'Найти'}
            </Button>
          </Grid>
        </Card>

        {error && <Text color="red">{error}</Text>}

        {!loading && ads.length === 0 && !error && (
          <Text color="gray">Объявлений не найдено. Попробуйте изменить фильтры.</Text>
        )}

        <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="3">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} showDescription />
          ))}
        </Grid>

        <Flex direction="column" gap="2">
          <Heading size="5">Карта</Heading>
          <AdsMap ads={ads} />
        </Flex>
      </Flex>
    </Container>
  );
}
