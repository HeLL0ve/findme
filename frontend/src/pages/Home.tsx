import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Container, Flex, Grid, Heading, Text, Box, Section } from '@radix-ui/themes';
import { MessageIcon, SearchIcon, AddIcon, DescriptionIcon } from '../components/common/Icons';
import { api } from '../api/axios';
import AdCard, { type AdCardData } from '../components/ads/AdCard';
import { useOnlineCount } from '../shared/useOnlineCount';
import { usePageTitle } from '../shared/usePageTitle';

type Ad = AdCardData;

export default function Home() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [foundAds, setFoundAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    ads: 0,
    foundPets: 0,
    chats: 0,
  });
  const online = useOnlineCount();
  usePageTitle();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [adsResponse, foundAdsResponse, statsResponse] = await Promise.all([
          api.get('/ads', { params: { take: 6 } }),
          api.get('/ads', { params: { take: 3, status: 'ARCHIVED' } }),
          api.get('/stats').catch(() => null),
        ]);
        if (!mounted) return;
        setAds(adsResponse.data);
        setFoundAds(foundAdsResponse.data);

        // Обновляем статистику из публичного API
        if (statsResponse?.data) {
          setStats(statsResponse.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Flex direction="column" gap="0">
      {/* Hero Section */}
      <Section size={{ initial: '2', md: '3' }} style={{
        background: 'linear-gradient(135deg, var(--violet-2) 0%, var(--violet-a2) 100%)',
        borderBottom: '1px solid var(--gray-a5)',
      }}>
        <Container size="4">
          <Flex direction={{ initial: 'column', md: 'row' }} gap={{ initial: '6', md: '8' }} align="center" justify="between" style={{ minHeight: '320px' }}>
            {/* Левая часть - Основной текст и кнопки */}
            <Flex direction="column" gap={{ initial: '4', md: '5' }} style={{ flex: 1 }}>
              <Flex direction="column" gap="3">
                <Heading size={{ initial: '7', md: '9' }} weight="bold" style={{
                  background: 'linear-gradient(135deg, var(--violet-11) 0%, var(--violet-10) 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em',
                }}>
                  FindMe — найди потерянного питомца
                </Heading>
                <Text size={{ initial: '3', md: '4' }} color="gray" style={{
                  lineHeight: '1.6',
                  maxWidth: '500px',
                }}>
                  Помогайте животным вернуться домой. Делитесь объявлениями, общайтесь и вместе спасайте жизни.
                </Text>
              </Flex>

              {/* Кнопки действия */}
              <Flex gap={{ initial: '2', md: '3' }} wrap="wrap" direction={{ initial: 'column', sm: 'row' }}>
                <Button asChild size="3" style={{
                  cursor: 'pointer',
                  fontWeight: 600,
                  minWidth: '160px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <Link to="/create-ad" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AddIcon width={20} height={20} />
                    <span>Создать объявление</span>
                  </Link>
                </Button>
                <Button variant="soft" asChild size="3" style={{
                  cursor: 'pointer',
                  fontWeight: 600,
                  minWidth: '160px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <Link to="/ads" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <SearchIcon width={20} height={20} />
                    <span>Начать поиск</span>
                  </Link>
                </Button>
              </Flex>

              {/* Telegram канал */}
              <Flex gap="2" align="center" style={{
                padding: 'var(--space-3)',
                background: 'var(--blue-a2)',
                borderRadius: 'var(--radius-2)',
                border: '1px solid var(--blue-a5)',
              }}>
                <Text size="2" color="gray">
                  Все объявления публикуются в нашем{' '}
                  <a
                    href="https://t.me/findme_by"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--blue-11)',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.textDecoration = 'underline';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.textDecoration = 'none';
                    }}
                  >
                    Telegram канале
                  </a>
                </Text>
              </Flex>
            </Flex>

            {/* Правая часть - Статистика онлайна */}
            <Box style={{
              background: 'var(--violet-a2)',
              borderRadius: '12px',
              padding: '16px',
              minWidth: '240px',
              boxShadow: '0 4px 16px var(--shadow-3)',
              border: '2px solid var(--violet-a6)',
            }}>
              <Flex direction="column" gap="3" align="center">
                <Flex direction="column" gap="2" align="center">
                  <Text size="1" weight="bold" color="gray">АКТИВНО СЕЙЧАС</Text>
                  <Heading size="8" style={{
                    color: 'var(--violet-11)',
                  }}>
                    {online}
                  </Heading>
                  <Flex gap="2" align="center" justify="center">
                    <Box style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'rgba(34, 197, 94, 1)',
                      animation: 'pulse 2s infinite',
                      boxShadow: '0 0 8px rgba(34, 197, 94, 0.8)',
                    }} />
                    <Text size="2" color="gray">пользователей онлайн</Text>
                  </Flex>
                </Flex>
              </Flex>
            </Box>
          </Flex>
        </Container>
      </Section>

      {/* Основной контент */}
      <Container size="4" style={{ paddingTop: '24px', paddingBottom: '32px' }}>

        {/* Как это работает */}
        <Flex direction="column" gap="5">
          <Heading size="5" weight="bold">Как это работает?</Heading>
          <Grid columns={{ initial: '1', md: '3' }} gap="4">
            {[
              {
                icon: <SearchIcon width={32} height={32} color="var(--blue-11)" />,
                title: 'Поиск',
                description: 'Ищите потерянных питомцев по типу, породе и местоположению',
                gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
              },
              {
                icon: <DescriptionIcon width={32} height={32} color="var(--green-11)" />,
                title: 'Объявления',
                description: 'Размещайте информацию о найденных животных с фото и контактами',
                gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
              },
              {
                icon: <MessageIcon width={32} height={32} color="var(--violet-11)" />,
                title: 'Общение',
                description: 'Общайтесь с другими пользователями и помогайте друг другу',
                gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
              },
            ].map((item, idx) => (
              <Box key={idx} style={{
                padding: 'var(--space-5)',
                borderRadius: 'var(--radius-3)',
                background: item.gradient,
                border: '1px solid var(--gray-a5)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }} onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(-6px)';
                el.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.08)';
              }} onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = 'none';
              }}>
                <Flex direction="column" gap="3">
                  <div style={{ opacity: 0.9 }}>{item.icon}</div>
                  <Heading size="3" weight="bold">{item.title}</Heading>
                  <Text size="2" color="gray">{item.description}</Text>
                </Flex>
              </Box>
            ))}
          </Grid>
        </Flex>

        {/* Секция последних объявлений */}
        <Flex direction="column" gap="6" style={{ marginTop: 'var(--space-8)' }}>
          <Flex justify="between" align="center" wrap="wrap" gap="4">
            <Flex direction="column" gap="2">
              <Heading size="6" weight="bold">Последние объявления</Heading>
              <Text size="2" color="gray">Помогите вернуть домой потерянных питомцев</Text>
            </Flex>
            <Button variant="soft" asChild>
              <Link to="/ads">Смотреть все →</Link>
            </Button>
          </Flex>

          {loading ? (
            <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} style={{ height: '320px', background: 'var(--gray-a2)', animation: 'pulse 2s infinite' }}>
                  <Box style={{ height: '100%' }} />
                </Card>
              ))}
            </Grid>
          ) : ads.length > 0 ? (
            <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="4">
              {ads.map((ad) => (
                <AdCard key={ad.id} ad={ad} showDescription />
              ))}
            </Grid>
          ) : (
            <Card style={{ background: 'var(--gray-a1)', textAlign: 'center', padding: '24px' }}>
              <Flex direction="column" gap="3" align="center" justify="center">
                <Heading size="4" color="gray">Объявлений нет</Heading>
                <Text color="gray">Будьте первыми! Создайте объявление о потерянном питомце.</Text>
                <Button asChild><Link to="/create-ad">Создать объявление</Link></Button>
              </Flex>
            </Card>
          )}
        </Flex>

        {/* Happy Endings Section */}
        {foundAds.length > 0 && (
          <Flex direction="column" gap="4" style={{ marginTop: '64px' }}>
            <Box style={{ borderTop: '1px solid var(--gray-a5)', paddingTop: '48px' }}>
              <Flex justify="between" align="center" wrap="wrap" gap="4">
                <Flex direction="column" gap="1">
                  <Heading size="6" weight="bold">🎉 Питомцы нашлись!</Heading>
                  <Text size="2" color="gray">Счастливые истории — питомцы вернулись домой</Text>
                </Flex>
                <Button variant="soft" color="green" asChild>
                  <Link to="/ads?status=ARCHIVED">Смотреть все →</Link>
                </Button>
              </Flex>
              <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="4" style={{ marginTop: 'var(--space-4)' }}>
                {foundAds.map((ad) => (
                  <AdCard key={ad.id} ad={ad} showDescription />
                ))}
              </Grid>
            </Box>
          </Flex>
        )}

        {/* Statistics Section */}
        <Flex direction="column" gap="4" style={{ marginTop: 'var(--space-8)' }}>
          <Heading size="5" weight="bold">Статистика платформы</Heading>
          <Grid columns={{ initial: '1', md: '2', lg: '4' }} gap="4">
            {[
              { label: 'Пользователей', value: stats.users, color: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)', borderColor: 'var(--blue-a6)', accentColor: 'var(--blue-11)' },
              { label: 'Объявлений размещено', value: stats.ads, color: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)', borderColor: 'var(--green-a6)', accentColor: 'var(--green-11)' },
              { label: 'Питомцев вернулись домой', value: stats.foundPets, color: 'linear-gradient(135deg, rgba(217, 119, 6, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)', borderColor: 'var(--amber-a6)', accentColor: 'var(--amber-11)' },
              { label: 'Активных чатов', value: stats.chats, color: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)', borderColor: 'var(--purple-a6)', accentColor: 'var(--purple-11)' },
            ].map((stat, idx) => (
              <Card key={idx} style={{
                background: stat.color,
                border: `2px solid ${stat.borderColor}`,
                padding: 'var(--space-4)',
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'default',
              }} onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(-4px) scale(1.02)';
                el.style.boxShadow = `0 12px 32px ${stat.borderColor}40`;
              }} onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(0) scale(1)';
                el.style.boxShadow = 'none';
              }}>
                <Flex direction="column" gap="2" align="center">
                  <Heading size="6" weight="bold" style={{ color: stat.accentColor }}>{stat.value}</Heading>
                  <Text size="2" color="gray">{stat.label}</Text>
                </Flex>
              </Card>
            ))}
          </Grid>
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
