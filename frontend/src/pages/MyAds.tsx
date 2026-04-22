import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Container, Flex, Grid, Heading, Text, Card, Box, Section } from '@radix-ui/themes';
import { SearchIcon, CheckIcon, ArchiveIcon, DescriptionIcon, PawIcon } from '../components/common/Icons';
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
          <Heading size="7" weight="bold">Мои объявления</Heading>
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
                { 
                  label: 'Всего', 
                  count: ads.length, 
                  icon: DescriptionIcon,
                  color: 'var(--gray-a2)',
                  iconColor: 'var(--gray-11)',
                  borderColor: 'var(--gray-a6)',
                },
                { 
                  label: 'Активных', 
                  count: approvedCount, 
                  icon: CheckIcon,
                  color: 'var(--green-a2)',
                  iconColor: 'var(--green-11)',
                  borderColor: 'var(--green-a6)',
                },
                { 
                  label: 'В архиве', 
                  count: archivedCount, 
                  icon: ArchiveIcon,
                  color: 'var(--orange-a2)',
                  iconColor: 'var(--orange-11)',
                  borderColor: 'var(--orange-a6)',
                },
              ].map((stat, idx) => (
                <Card key={idx} style={{
                  flex: 1,
                  background: stat.color,
                  border: `2px solid ${stat.borderColor}`,
                  textAlign: 'center',
                  padding: 'var(--space-4)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    opacity: 0.1,
                    pointerEvents: 'none',
                  }}>
                    <stat.icon width={100} height={100} color={stat.iconColor} />
                  </div>
                  <Flex direction="column" gap="2" align="center" style={{ position: 'relative', zIndex: 1 }}>
                    <stat.icon width={32} height={32} color={stat.iconColor} />
                    <Text size="6" weight="bold" style={{ color: stat.iconColor }}>
                      {stat.count}
                    </Text>
                    <Text size="2" weight="medium" color="gray">{stat.label}</Text>
                  </Flex>
                </Card>
              ))}
            </Flex>

            {/* Create button */}
            <Flex gap="2" align="center">
              <Button asChild size="3" style={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, var(--violet-9) 0%, var(--violet-11) 100%)',
                padding: '0 24px',
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Link to="/create-ad" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                  <DescriptionIcon width={20} height={20} color="white" />
                  Новое объявление
                </Link>
              </Button>
            </Flex>
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
              { value: 'ALL' as const, label: 'Все', icon: PawIcon },
              { value: 'APPROVED' as const, label: 'Активные', icon: CheckIcon },
              { value: 'ARCHIVED' as const, label: 'В архиве', icon: ArchiveIcon },
            ].map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={statusFilter === value ? 'solid' : 'outline'}
                size="2"
                onClick={() => setStatusFilter(value)}
                style={{
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon width={18} height={18} />
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
              background: 'linear-gradient(135deg, var(--gray-a1) 0%, var(--gray-a2) 100%)',
              textAlign: 'center',
              padding: 'var(--space-8)',
              border: '2px dashed var(--gray-a6)',
              borderRadius: 'var(--radius-3)',
            }}>
              <Flex direction="column" gap="4" align="center" justify="center">
                <div style={{ opacity: 0.3 }}>
                  <PawIcon width={80} height={80} color="var(--gray-11)" />
                </div>
                <Heading size="5" color="gray">
                  {statusFilter === 'ARCHIVED'
                    ? 'Нет архивированных объявлений'
                    : statusFilter === 'APPROVED'
                    ? 'Нет активных объявлений'
                    : 'У вас пока нет объявлений'}
                </Heading>
                <Text color="gray" size="3">
                  {statusFilter === 'ALL'
                    ? 'Создайте первое объявление, чтобы помочь потерянным питомцам'
                    : 'Измените фильтр или создайте новое объявление'}
                </Text>
                <Button asChild size="3" style={{
                  background: 'linear-gradient(135deg, var(--violet-9) 0%, var(--violet-11) 100%)',
                  padding: '0 20px',
                  marginTop: 'var(--space-2)',
                }}>
                  <Link to="/create-ad" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                    <DescriptionIcon width={18} height={18} color="white" />
                    Создать объявление
                  </Link>
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
                        <Link to={`/my-ads/${ad.id}/edit`}>Редактировать</Link>
                      </Button>
                      {ad.status !== 'ARCHIVED' && (
                        <ConfirmActionDialog
                          title="Переместить объявление в архив?"
                          description="Объявление перестанет отображаться в активном поиске."
                          confirmText="В архив"
                          color="orange"
                          onConfirm={() => moveToArchive(ad.id)}
                          trigger={<Button size="1" variant="soft" color="gray" style={{ flex: 1 }}>Архив</Button>}
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
