import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Container, Flex, Grid, Heading, Text, Card, Box, Section } from '@radix-ui/themes';
import { SearchIcon, CheckIcon, ArchiveIcon } from '../components/common/Icons';
import { api } from '../api/axios';
import AdCard, { type AdCardData } from '../components/ads/AdCard';
import ConfirmActionDialog from '../components/common/ConfirmActionDialog';
import { extractApiErrorMessage } from '../shared/apiError';

type Ad = AdCardData;

export default function MyAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'ARCHIVED'>('ALL');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
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

  const filteredAds = ads.filter(ad => 
    statusFilter === 'ALL' ? true : ad.status === statusFilter
  );

  const approvedCount = ads.filter(ad => ad.status === 'APPROVED').length;
  const archivedCount = ads.filter(ad => ad.status === 'ARCHIVED').length;

  return (
    <Flex direction="column" gap="0">
      {/* Header */}
      <Section size="2" style={{
        background: 'linear-gradient(135deg, var(--violet-2) 0%, var(--accent-soft) 100%)',
        borderBottom: '1px solid var(--gray-a5)',
      }}>
        <Container size="4">
          <Heading size="7" weight="bold">📂 Мои объявления</Heading>
          <Text color="gray" size="2">
            Управляйте вашими объявлениями о потерянных и найденных питомцах
          </Text>
        </Container>
      </Section>

      <Container size="4" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-6)' }}>
        <Flex direction="column" gap="6">
          {/* Stats & Filters */}
          <Flex gap="4" direction={{ initial: 'column', sm: 'row' }} wrap="wrap">
            {/* Stats Card */}
            <Flex gap="3" style={{ flex: '1', minWidth: '300px' }}>
              {[
                { label: 'Всего', count: ads.length, component: null, color: 'var(--gray-a2)' },
                { label: 'Активных', count: approvedCount, component: <CheckIcon />, color: 'var(--green-a2)' },
                { label: 'В архиве', count: archivedCount, component: <ArchiveIcon />, color: 'var(--orange-a2)' },
              ].map((stat, idx) => (
                <Card key={idx} style={{
                  flex: 1,
                  background: stat.color,
                  border: `1px solid var(--gray-a6)`,
                  textAlign: 'center',
                  padding: 'var(--space-3)',
                }}>
                  <Flex direction="column" gap="1" align="center">
                    {stat.component ? <Text size="4">{stat.component}</Text> : <Text size="4">📋</Text>}
                    <Text size="2" weight="bold">{stat.count}</Text>
                    <Text size="1" color="gray">{stat.label}</Text>
                  </Flex>
                </Card>
              ))}
            </Flex>

            {/* Create button */}
            <Button asChild size="2" style={{
              fontWeight: 600,
              alignSelf: 'center',
            }}>
              <Link to="/create-ad">➕ Новое объявление</Link>
            </Button>
          </Flex>

          {/* Error */}
          {error && (
            <Card style={{
              background: 'var(--red-2)',
              borderLeft: '3px solid var(--red-9)',
            }}>
              <Text color="red" size="2">{error}</Text>
            </Card>
          )}

          {/* Filters */}
          <Flex gap="2" wrap="wrap">
            {[
              { value: 'ALL' as const, label: 'Все' },
              { value: 'APPROVED' as const, label: 'Активные' },
              { value: 'ARCHIVED' as const, label: '📦 В архиве' },
            ].map(({ value, label }) => (
              <Button
                key={value}
                variant={statusFilter === value ? 'solid' : 'soft'}
                size="2"
                onClick={() => setStatusFilter(value)}
              >
                {label}
              </Button>
            ))}
          </Flex>

          {/* Loading State */}
          {loading && (
            <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="4">
              {[1, 2, 3].map((i) => (
                <Card key={i} style={{
                  height: '360px',
                  background: 'var(--gray-a2)',
                  animation: 'pulse 2s infinite',
                }}>
                  <Box style={{ height: '100%' }} />
                </Card>
              ))}
            </Grid>
          )}

          {/* Empty State */}
          {!loading && filteredAds.length === 0 && (
            <Card style={{
              background: 'var(--gray-a2)',
              textAlign: 'center',
              padding: 'var(--space-6)',
            }}>
              <Flex direction="column" gap="3" align="center" justify="center">
                <Text size="5">
                  {statusFilter === 'ARCHIVED' ? '📦' : statusFilter === 'APPROVED' ? '✅' : '�'}
                </Text>
                <Heading size="4" color="gray">
                  {statusFilter === 'ARCHIVED'
                    ? 'Нет архивированных объявлений'
                    : statusFilter === 'APPROVED'
                    ? 'Нет активных объявлений'
                    : 'У вас пока нет объявлений'}
                </Heading>
                <Text color="gray">
                  {statusFilter === 'ALL'
                    ? 'Создайте первое объявление, чтобы помочь потерянным питомцам'
                    : 'Измените фильтр или создайте новое объявление'}
                </Text>
                <Button asChild>
                  <Link to="/create-ad">➕ Создать объявление</Link>
                </Button>
              </Flex>
            </Card>
          )}

          {/* Ads Grid */}
          {!loading && filteredAds.length > 0 && (
            <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="4">
              {filteredAds.map((ad) => (
                <AdCard
                  key={ad.id}
                  ad={ad}
                  showDescription
                  actions={(
                    <Flex direction={{ initial: 'column', sm: 'row' }} gap="2" style={{ width: '100%' }}>
                      <Button asChild size="1" variant="outline" style={{ flex: 1 }}>
                        <Link to={`/ads/${ad.id}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><SearchIcon width={16} height={16} />Открыть</Link>
                      </Button>
                      <Button asChild variant="soft" size="1" style={{ flex: 1 }}>
                        <Link to={`/my-ads/${ad.id}/edit`}>✏️ Редак.</Link>
                      </Button>
                      {ad.status !== 'ARCHIVED' && (
                        <ConfirmActionDialog
                          title="Переместить объявление в архив?"
                          description="Объявление перестанет отображаться в активном поиске."
                          confirmText="В архив"
                          color="orange"
                          onConfirm={() => moveToArchive(ad.id)}
                          trigger={<Button size="1" variant="soft" color="gray" style={{ flex: 1 }}>📦 Архив</Button>}
                        />
                      )}
                    </Flex>
                  )}
                />
              ))}
            </Grid>
          )}
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
      `}</style>
    </Flex>
  );
}
