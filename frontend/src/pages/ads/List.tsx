import { useEffect, useState } from 'react';
import { Button, Card, Container, Flex, Grid, Heading, Select, Text, TextField, Box, Section } from '@radix-ui/themes';
import { SearchIcon, FilterIcon, ListIcon, MapIcon } from '../../components/common/Icons';
import { api } from '../../api/axios';
import AdCard, { type AdCardData } from '../../components/ads/AdCard';
import { extractApiErrorMessage } from '../../shared/apiError';
import AdsMap from '../../shared/AdsMap';
import { usePageTitle } from '../../shared/usePageTitle';

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
  since: 'ALL' | 'week' | 'month';
};

type ViewMode = 'list' | 'map';

export default function AdsList() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    q: '',
    city: '',
    type: 'ALL',
    status: 'APPROVED',
    since: 'ALL',
  });
  usePageTitle('Поиск объявлений');

  const PAGE_SIZE = 9;

  async function fetchAds() {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { status: filters.status };
      if (filters.q.trim()) params.q = filters.q.trim();
      if (filters.city.trim()) params.city = filters.city.trim();
      if (filters.type !== 'ALL') params.type = filters.type;
      if (filters.since !== 'ALL') params.since = filters.since;

      const response = await api.get('/ads', { params });
      setAds(response.data);
      setPage(1); // сбрасываем на первую страницу при новом поиске
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

  const totalPages = Math.ceil(ads.length / PAGE_SIZE);
  const paginatedAds = ads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const resultsCount = ads.length;

  return (
    <Flex direction="column" gap="0" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Header Section */}
      <Section size="2" style={{
        background: 'linear-gradient(135deg, var(--violet-2) 0%, var(--accent-soft) 100%)',
        borderBottom: '1px solid var(--gray-a5)',
      }}>
        <Container size="4">
          <Flex direction="column" gap="2">
            <Flex align="center" gap="2">
              <SearchIcon width={28} height={28} />
              <Heading size="7" weight="bold">Поиск потерянных питомцев</Heading>
            </Flex>
            <Text color="gray" size="2">
              Найдите потерянного или найденного питомца по типу, породе и местоположению
            </Text>
          </Flex>
        </Container>
      </Section>

      <Container size="4" style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-6)' }}>
        <Flex gap="6" direction={{ initial: 'column', md: 'row' }} style={{ flex: 1 }}>
          {/* Sidebar Filters - Desktop */}
          <Box
            className="sidebar-filters"
            style={{
              minWidth: '280px',
            }}
          >
            <Card style={{
              border: '1px solid var(--gray-a7)',
              borderRadius: 'var(--radius-3)',
            }}>
              <Flex direction="column" gap="4">
                <Flex gap="2" align="center">
                  <SearchIcon width={20} height={20}/>
                  <Heading size="4" weight="bold">Фильтры</Heading>
                </Flex>

                {/* Search Input */}
                <Flex direction="column" gap="2">
                  <Text size="2" weight="bold" color="gray">Поиск</Text>
                  <TextField.Root
                    placeholder="Кличка, описание, порода"
                    value={filters.q}
                    onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
                  />
                </Flex>

                {/* City Input */}
                <Flex direction="column" gap="2">
                  <Text size="2" weight="bold" color="gray">Город</Text>
                  <TextField.Root
                    placeholder="Укажите город"
                    value={filters.city}
                    onChange={(event) => setFilters((prev) => ({ ...prev, city: event.target.value }))}
                  />
                </Flex>

                {/* Type Filter */}
                <Flex direction="column" gap="2">
                  <Text size="2" weight="bold" color="gray">Тип</Text>
                  <Select.Root value={filters.type} onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value as Filters['type'] }))}>
                    <Select.Trigger placeholder="Выберите тип" />
                    <Select.Content>
                      <Select.Item value="ALL">Все типы</Select.Item>
                      <Select.Item value="LOST">Потерян</Select.Item>
                      <Select.Item value="FOUND">Найден</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Flex>

                {/* Status Filter */}
                <Flex direction="column" gap="2">
                  <Text size="2" weight="bold" color="gray">Статус</Text>
                  <Select.Root value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value as Filters['status'] }))}>
                    <Select.Trigger placeholder="Выберите статус" />
                    <Select.Content>
                      <Select.Item value="APPROVED">Опубликовано</Select.Item>
                      <Select.Item value="ARCHIVED">В архиве</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Flex>

                {/* Date Filter */}
                <Flex direction="column" gap="2">
                  <Text size="2" weight="bold" color="gray">Дата публикации</Text>
                  <Select.Root value={filters.since} onValueChange={(value) => setFilters((prev) => ({ ...prev, since: value as Filters['since'] }))}>
                    <Select.Trigger placeholder="Любое время" />
                    <Select.Content>
                      <Select.Item value="ALL">Любое время</Select.Item>
                      <Select.Item value="week">За последние 7 дней</Select.Item>
                      <Select.Item value="month">За последний месяц</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Flex>

                <Button onClick={() => void fetchAds()} disabled={loading} style={{
                  width: '100%',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}>
                  {loading ? 'Загрузка...' : 'Найти'}
                </Button>
              </Flex>
            </Card>
          </Box>

          {/* Main Content */}
          <Flex direction="column" gap="4" style={{ flex: 1 }}>
            {/* Mobile Filters */}
            <Box className="mobile-filters">
              <Button
                variant={showFilters ? 'solid' : 'soft'}
                onClick={() => setShowFilters(!showFilters)}
                style={{ width: '100%', fontWeight: 600, cursor: 'pointer' }}
              >
                <Flex align="center" gap="2">
                  <FilterIcon width={16} height={16} />
                  {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
                </Flex>
              </Button>

              {showFilters && (
                <Card style={{ 
                  marginTop: 'var(--space-2)',
                  border: '1px solid var(--gray-a7)',
                  borderRadius: 'var(--radius-3)',
                }}>
                  <Flex direction="column" gap="3">
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
                    <Select.Root value={filters.since} onValueChange={(value) => setFilters((prev) => ({ ...prev, since: value as Filters['since'] }))}>
                      <Select.Trigger placeholder="Дата" />
                      <Select.Content>
                        <Select.Item value="ALL">Любое время</Select.Item>
                        <Select.Item value="week">За 7 дней</Select.Item>
                        <Select.Item value="month">За месяц</Select.Item>
                      </Select.Content>
                    </Select.Root>
                    <Button onClick={() => void fetchAds()} disabled={loading} style={{ width: '100%', fontWeight: 600, cursor: 'pointer' }}>
                      {loading ? 'Загрузка...' : 'Найти'}
                    </Button>
                  </Flex>
                </Card>
              )}
            </Box>

            {/* View Mode Controls */}
            <Flex justify="between" align="center" wrap="wrap" gap="3">
              <Flex gap="2" align="center">
                <Button
                  variant={viewMode === 'list' ? 'solid' : 'soft'}
                  onClick={() => setViewMode('list')}
                  size="2"
                >
                  <ListIcon width={16} height={16} />
                  Список
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'solid' : 'soft'}
                  onClick={() => setViewMode('map')}
                  size="2"
                >
                  <MapIcon width={16} height={16} />
                  Карта
                </Button>
              </Flex>

              {!loading && (
                <Text size="2" color="gray" weight="medium">
                  Найдено: <Text weight="bold" color="blue">{resultsCount}</Text> объявлений
                </Text>
              )}
            </Flex>

            {/* Error Message */}
            {error && (
              <Card style={{
                background: 'var(--red-2)',
                borderLeft: '3px solid var(--red-9)',
              }}>
                <Text color="red" size="2">{error}</Text>
              </Card>
            )}

            {/* Empty State */}
            {!loading && ads.length === 0 && !error && (
              <Card style={{
                textAlign: 'center',
                padding: 'var(--space-6)',
                background: 'var(--gray-a2)',
              }}>
                <Flex direction="column" gap="3" align="center" justify="center">
                  <Text size="4">😞</Text>
                  <Heading size="4" color="gray">Объявлений не найдено</Heading>
                  <Text color="gray" size="2">Попробуйте изменить параметры фильтров или создайте собственное объявление</Text>
                  <Button variant="soft" asChild>
                    <a href="/create-ad">Создать объявление</a>
                  </Button>
                </Flex>
              </Card>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <>
                <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="4" style={{
                  opacity: loading ? 0.6 : 1,
                  pointerEvents: loading ? 'none' : 'auto',
                }}>
                  {loading ? (
                    [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                      <Card key={i} style={{
                        height: '360px',
                        background: 'var(--gray-a2)',
                        animation: 'pulse 2s infinite',
                      }}>
                        <Box style={{ height: '100%' }} />
                      </Card>
                    ))
                  ) : (
                    paginatedAds.map((ad) => (
                      <AdCard key={ad.id} ad={ad} showDescription />
                    ))
                  )}
                </Grid>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                  <Flex justify="center" align="center" gap="2" style={{ marginTop: 'var(--space-4)' }}>
                    <Button
                      variant="soft"
                      size="2"
                      disabled={page === 1}
                      onClick={() => { setPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
                      «
                    </Button>
                    <Button
                      variant="soft"
                      size="2"
                      disabled={page === 1}
                      onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
                      ‹
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === 'ellipsis' ? (
                          <Text key={`ellipsis-${idx}`} size="2" color="gray" style={{ padding: '0 4px' }}>…</Text>
                        ) : (
                          <Button
                            key={item}
                            size="2"
                            variant={page === item ? 'solid' : 'soft'}
                            onClick={() => { setPage(item as number); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          >
                            {item}
                          </Button>
                        )
                      )
                    }

                    <Button
                      variant="soft"
                      size="2"
                      disabled={page === totalPages}
                      onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
                      ›
                    </Button>
                    <Button
                      variant="soft"
                      size="2"
                      disabled={page === totalPages}
                      onClick={() => { setPage(totalPages); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
                      »
                    </Button>
                  </Flex>
                )}
              </>
            )}

            {/* Map View */}
            {viewMode === 'map' && (
              <Box style={{
                height: 'calc(100vh - 320px)',
                minHeight: '480px',
                borderRadius: 'var(--radius-2)',
                overflow: 'hidden',
                border: '1px solid var(--gray-a6)',
                opacity: loading ? 0.6 : 1,
              }}>
                {!loading && ads.length > 0 && <AdsMap ads={ads} height="100%" />}
                {loading && (
                  <Flex align="center" justify="center" style={{ height: '100%' }}>
                    <Text color="gray">⏳ Загрузка карты...</Text>
                  </Flex>
                )}
                {!loading && ads.length === 0 && (
                  <Flex align="center" justify="center" style={{ height: '100%' }}>
                    <Text color="gray">На карте объявлений нет</Text>
                  </Flex>
                )}
              </Box>
            )}
          </Flex>
        </Flex>
      </Container>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        @media (max-width: 768px) {
          .sidebar-filters {
            display: none !important;
          }
        }

        @media (min-width: 768px) {
          .mobile-filters {
            display: none !important;
          }
        }
      `}</style>
    </Flex>
  );
}
