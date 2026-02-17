import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Container, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { api } from '../api/axios';
import { useOnlineCount } from '../shared/useOnlineCount';
import { adStatusLabel, adTypeLabel } from '../shared/labels';

type Ad = {
  id: string;
  petName?: string | null;
  animalType?: string | null;
  status: string;
  type: 'LOST' | 'FOUND';
};

export default function Home() {
  const [ads, setAds] = useState<Ad[]>([]);
  const online = useOnlineCount();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await api.get('/ads', { params: { take: 6 } });
        if (!mounted) return;
        setAds(response.data);
      } catch (error) {
        console.error(error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Container size="4">
      <Flex direction="column" gap="5">
        <Card>
          <Flex direction={{ initial: 'column', md: 'row' }} gap="4" align="center" justify="between">
            <Flex direction="column" gap="3" style={{ flex: 1 }}>
              <Heading size="9">FindMe — найди потерянного питомца</Heading>
              <Text color="gray">
                Публикуйте объявления, общайтесь с участниками поиска и помогайте возвращать домашних животных.
              </Text>
              <Flex gap="3" wrap="wrap">
                <Button asChild>
                  <Link to="/create-ad">Создать объявление</Link>
                </Button>
                <Button variant="soft" asChild>
                  <Link to="/ads">Поиск</Link>
                </Button>
              </Flex>
            </Flex>
            <Card style={{ minWidth: 220 }}>
              <Text color="gray">Онлайн-участники</Text>
              <Heading size="8">{online}</Heading>
              <Text size="2" color="gray">сейчас подключено к платформе</Text>
            </Card>
          </Flex>
        </Card>

        <Flex direction="column" gap="3">
          <Heading size="6">Последние объявления</Heading>
          <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="3">
            {ads.map((ad) => (
              <Card key={ad.id} asChild>
                <Link to={`/ads/${ad.id}`} style={{ textDecoration: 'none' }}>
                  <Flex direction="column" gap="2">
                    <Text weight="bold" className="truncate">{ad.petName || 'Без клички'}</Text>
                    <Text size="2" color="gray" className="truncate">{ad.animalType || 'Не указано'}</Text>
                    <Flex gap="2">
                      <Badge color={ad.type === 'LOST' ? 'orange' : 'green'}>{adTypeLabel(ad.type)}</Badge>
                      <Badge color="blue">{adStatusLabel(ad.status)}</Badge>
                    </Flex>
                  </Flex>
                </Link>
              </Card>
            ))}
          </Grid>
        </Flex>
      </Flex>
    </Container>
  );
}
