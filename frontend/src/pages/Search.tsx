import { useEffect, useState } from 'react';
import { api } from '../api/axios';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Container, Flex, Grid, Heading, Select, Text, TextField } from '@radix-ui/themes';
import AdsMap from '../shared/AdsMap';

type Ad = {
  id: string;
  petName?: string | null;
  animalType?: string | null;
  breed?: string | null;
  status: string;
  type: 'LOST' | 'FOUND';
  photos?: Array<{ photoUrl: string }>;
  location?: { latitude?: number | null; longitude?: number | null; address?: string | null; city?: string | null } | null;
};

export default function SearchPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    q: '',
    type: 'ALL',
    status: 'APPROVED',
    city: '',
  });

  async function fetchAds() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.q) params.q = filters.q;
      if (filters.type !== 'ALL') params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.city) params.city = filters.city;
      const res = await api.get('/ads', { params });
      setAds(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchAds();
  }, []);

  return (
    <Container size="3">
      <Flex direction="column" gap="4">
        <Heading size="8">Поиск объявлений</Heading>
        <Card>
          <Grid columns={{ initial: '1', md: '5' }} gap="3" align="center">
            <TextField.Root
              placeholder="Кличка, описание, порода..."
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            />
            <TextField.Root
              placeholder="Город"
              value={filters.city}
              onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
            />
            <Select.Root value={filters.type} onValueChange={(v) => setFilters((f) => ({ ...f, type: v }))}>
              <Select.Trigger placeholder="Тип" />
              <Select.Content>
                <Select.Item value="ALL">Все</Select.Item>
                <Select.Item value="LOST">Потерян</Select.Item>
                <Select.Item value="FOUND">Найден</Select.Item>
              </Select.Content>
            </Select.Root>
            <Select.Root value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}>
              <Select.Trigger placeholder="Статус" />
              <Select.Content>
                <Select.Item value="APPROVED">Активные</Select.Item>
                <Select.Item value="ARCHIVED">Архив</Select.Item>
              </Select.Content>
            </Select.Root>
            <Button onClick={() => void fetchAds()} disabled={loading}>
              {loading ? 'Загрузка...' : 'Найти'}
            </Button>
          </Grid>
        </Card>

        <Grid columns={{ initial: '1', md: '2' }} gap="3">
          {ads.map((ad) => (
            <Card key={ad.id} asChild>
              <Link to={`/ads/${ad.id}`} style={{ textDecoration: 'none' }}>
                <Flex gap="3" align="center">
                  <div
                    style={{
                      width: 120,
                      height: 80,
                      borderRadius: 10,
                      background: 'var(--accent-3)',
                    }}
                  />
                  <Flex direction="column" gap="1" style={{ flex: 1 }}>
                    <Text weight="bold">{ad.petName || 'Без имени'}</Text>
                    <Text size="2" color="gray">
                      {ad.animalType || 'Неизвестно'} {ad.breed ? `• ${ad.breed}` : ''}
                    </Text>
                    <Flex gap="2">
                      <Badge color={ad.type === 'LOST' ? 'red' : 'green'}>{ad.type}</Badge>
                      <Badge color={ad.status === 'APPROVED' ? 'blue' : 'gray'}>{ad.status}</Badge>
                    </Flex>
                  </Flex>
                </Flex>
              </Link>
            </Card>
          ))}
        </Grid>
        {!loading && ads.length === 0 && (
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
