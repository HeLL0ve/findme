import { useEffect, useState } from 'react';
import { Button, Card, Container, Flex, Grid, Heading, Section, Text } from '@radix-ui/themes';
import { HeartFilledIcon } from '../components/common/Icons';
import { api } from '../api/axios';
import AdCard, { type AdCardData } from '../components/ads/AdCard';
import { extractApiErrorMessage } from '../shared/apiError';
import { useFavoritesStore } from '../shared/favoritesStore';
import { usePageTitle } from '../shared/usePageTitle';

export default function FavoritesPage() {
  usePageTitle('Избранное');
  const ids = useFavoritesStore((s) => s.ids);
  const toggle = useFavoritesStore((s) => s.toggle);
  const [ads, setAds] = useState<AdCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ids.size === 0) {
      setAds([]);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    const fetches = [...ids].map((id) =>
      api.get(`/ads/${id}`).then((r) => r.data as AdCardData).catch(() => null),
    );

    void Promise.all(fetches).then((results) => {
      if (!mounted) return;
      setAds(results.filter((ad): ad is AdCardData => ad !== null));
      setLoading(false);
    });

    return () => { mounted = false; };
  }, [ids]);

  return (
    <Flex direction="column" gap="0">
      <Section size="2" style={{
        background: 'linear-gradient(135deg, var(--red-2) 0%, var(--pink-2) 100%)',
        borderBottom: '1px solid var(--gray-a5)',
      }}>
        <Container size="4">
          <Flex align="center" gap="2">
            <HeartFilledIcon width={28} height={28} color="var(--red-9)" />
            <Heading size="7" weight="bold" style={{margin:'0px'}}>Избранное</Heading>
          </Flex>
          <Text color="gray" size="2">Сохранённые объявления о питомцах</Text>
        </Container>
      </Section>

      <Container size="4" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-6)' }}>
        {loading && (
          <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="4">
            {[1, 2, 3].map((i) => (
              <Card key={i} style={{ height: '360px', background: 'var(--gray-a2)', animation: 'pulse 2s infinite' }} />
            ))}
          </Grid>
        )}

        {!loading && error && (
          <Card style={{ background: 'var(--red-2)', borderLeft: '3px solid var(--red-9)' }}>
            <Text color="red" size="2">{extractApiErrorMessage(error)}</Text>
          </Card>
        )}

        {!loading && ids.size === 0 && (
          <Card style={{
            textAlign: 'center',
            padding: 'var(--space-8)',
            background: 'var(--gray-a2)',
            border: '2px dashed var(--gray-a6)',
          }}>
            <Flex direction="column" gap="3" align="center">
              <HeartFilledIcon width={56} height={56} color="var(--gray-a8)" />
              <Heading size="4" color="gray">Избранное пусто</Heading>
              <Text color="gray" size="2">
                Нажмите на сердечко на карточке объявления, чтобы сохранить его здесь
              </Text>
              <Button variant="soft" asChild>
                <a href="/ads">Перейти к объявлениям</a>
              </Button>
            </Flex>
          </Card>
        )}

        {!loading && ads.length > 0 && (
          <Flex direction="column" gap="4">
            <Text size="2" color="gray" weight="medium">
              Сохранено: <Text weight="bold" color="red">{ads.length}</Text> объявлений
            </Text>
            <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="4">
              {ads.map((ad) => (
                <AdCard
                  key={ad.id}
                  ad={ad}
                  showDescription
                  actions={
                    <Button
                      size="1"
                      variant="soft"
                      color="red"
                      onClick={() => toggle(ad.id)}
                      style={{ width: '100%', cursor: 'pointer' }}
                    >
                      <HeartFilledIcon width={13} height={13} color="var(--red-9)" />
                      Убрать из избранного
                    </Button>
                  }
                />
              ))}
            </Grid>
          </Flex>
        )}
      </Container>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </Flex>
  );
}
