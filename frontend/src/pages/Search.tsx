import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Container, Flex, Grid, Heading, Select, Text, TextField } from '@radix-ui/themes';
import { api } from '../api/axios';
import { extractApiErrorMessage } from '../shared/apiError';
import AdsMap from '../shared/AdsMap';
import { adStatusLabel, adTypeLabel } from '../shared/labels';

type Ad = {
  id: string;
  petName?: string | null;
  animalType?: string | null;
  breed?: string | null;
  status: string;
  type: 'LOST' | 'FOUND';
  location?: { latitude?: number | null; longitude?: number | null; address?: string | null; city?: string | null } | null;
};

export default function SearchPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    q: '',
    type: 'ALL',
    status: 'APPROVED',
    city: '',
  });

  async function fetchAds() {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filters.q) params.q = filters.q;
      if (filters.type !== 'ALL') params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.city) params.city = filters.city;
      const response = await api.get('/ads', { params });
      setAds(response.data);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось выполнить поиск'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchAds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container size="3">
      <Flex direction="column" gap="4">
        <Heading size="8">Поиск объявлений</Heading>

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
            <Select.Root value={filters.type} onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}>
              <Select.Trigger placeholder="Тип" />
              <Select.Content>
                <Select.Item value="ALL">Все</Select.Item>
                <Select.Item value="LOST">Потерян</Select.Item>
                <Select.Item value="FOUND">Найден</Select.Item>
              </Select.Content>
            </Select.Root>
            <Select.Root value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
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

        <Grid columns={{ initial: '1', md: '2' }} gap="3">
          {ads.map((ad) => (
            <Card key={ad.id} asChild>
              <Link to={`/ads/${ad.id}`} style={{ textDecoration: 'none' }}>
                <Flex gap="3" align="center">
                  <div style={{ width: 120, height: 80, borderRadius: 12, background: 'var(--accent-soft)' }} />
                  <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
                    <Text weight="bold" className="truncate">{ad.petName || 'Без клички'}</Text>
                    <Text size="2" color="gray" className="truncate">
                      {[ad.animalType || 'Не указано', ad.breed || null].filter(Boolean).join(' · ')}
                    </Text>
                    <Flex gap="2">
                      <Badge color={ad.type === 'LOST' ? 'orange' : 'green'}>{adTypeLabel(ad.type)}</Badge>
                      <Badge color={ad.status === 'APPROVED' ? 'blue' : 'gray'}>{adStatusLabel(ad.status)}</Badge>
                    </Flex>
                  </Flex>
                </Flex>
              </Link>
            </Card>
          ))}
        </Grid>

        {!loading && ads.length === 0 && !error && (
          <Text color="gray">Ничего не найдено. Попробуйте изменить фильтры.</Text>
        )}

        <Flex direction="column" gap="2">
          <Heading size="5">Карта</Heading>
          <AdsMap ads={ads} />
        </Flex>
      </Flex>
    </Container>
  );
}
