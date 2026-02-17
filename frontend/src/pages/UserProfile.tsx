import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Badge, Card, Container, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { api } from '../api/axios';
import { extractApiErrorMessage } from '../shared/apiError';
import { adStatusLabel, adTypeLabel } from '../shared/labels';
import { config } from '../shared/config';
import UserAvatarLink from '../components/user/UserAvatarLink';

type PublicUser = {
  id: string;
  name?: string | null;
  avatarUrl?: string | null;
  telegramUsername?: string | null;
  createdAt: string;
};

type PublicAd = {
  id: string;
  petName?: string | null;
  animalType?: string | null;
  breed?: string | null;
  color?: string | null;
  type: 'LOST' | 'FOUND';
  status: string;
  photos?: Array<{ photoUrl: string }>;
};

export default function UserProfilePage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [ads, setAds] = useState<PublicAd[]>([]);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        const response = await api.get(`/users/${id}/public`);
        if (!mounted) return;
        setUser(response.data.user);
        setAds(response.data.ads || []);
      } catch (err) {
        if (!mounted) return;
        setError(extractApiErrorMessage(err, 'Не удалось загрузить профиль пользователя'));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <Container size="3"><Text>Загрузка...</Text></Container>;
  if (error) return <Container size="3"><Text color="red">{error}</Text></Container>;
  if (!user) return <Container size="3"><Text color="red">Профиль не найден</Text></Container>;

  return (
    <Container size="3">
      <Flex direction="column" gap="4">
        <Card>
          <Flex direction="column" gap="3">
            <UserAvatarLink
              userId={user.id}
              name={user.name}
              avatarUrl={user.avatarUrl}
              subtitle={`На платформе с ${new Date(user.createdAt).toLocaleDateString()}`}
              size="3"
            />
            {user.telegramUsername && (
              <Text size="2" color="gray">Telegram: @{user.telegramUsername}</Text>
            )}
          </Flex>
        </Card>

        <Flex direction="column" gap="2">
          <Heading size="6">Объявления пользователя</Heading>
          {ads.length === 0 && <Text color="gray">Публичных объявлений пока нет.</Text>}
          <Grid columns={{ initial: '1', md: '2' }} gap="3">
            {ads.map((ad) => {
              const preview = ad.photos?.[0]?.photoUrl;
              const previewSrc = preview ? (preview.startsWith('http') ? preview : `${config.apiUrl || ''}${preview}`) : null;
              return (
                <Card key={ad.id} asChild>
                  <Link to={`/ads/${ad.id}`} style={{ textDecoration: 'none' }}>
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
                          <img src={previewSrc} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                      </div>
                      <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
                        <Text weight="bold" className="truncate">{ad.petName || 'Без клички'}</Text>
                        <Text size="2" color="gray" className="truncate">
                          {[ad.animalType || 'Не указано', ad.breed || null, ad.color ? `окрас: ${ad.color}` : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                        <Flex gap="2" wrap="wrap">
                          <Badge color={ad.type === 'LOST' ? 'orange' : 'green'}>{adTypeLabel(ad.type)}</Badge>
                          <Badge color={ad.status === 'APPROVED' ? 'blue' : 'gray'}>{adStatusLabel(ad.status)}</Badge>
                        </Flex>
                      </Flex>
                    </Flex>
                  </Link>
                </Card>
              );
            })}
          </Grid>
        </Flex>
      </Flex>
    </Container>
  );
}
