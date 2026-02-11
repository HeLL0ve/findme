import { useEffect, useState } from 'react';
import { api } from '../api/axios';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Container, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { useOnlineCount } from '../shared/useOnlineCount';

type Ad = {
  id: string;
  petName?: string | null;
  animalType?: string | null;
  status: string;
  type: string;
};

export default function Home() {
  const [ads, setAds] = useState<Ad[]>([]);
  const online = useOnlineCount();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/ads', { params: { take: 6 } });
        if (!mounted) return;
        setAds(res.data);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { mounted = false };
  }, []);

  return (
    <Container size="3">
      <Flex direction="column" gap="5">
        <Card>
          <Flex direction={{ initial: 'column', md: 'row' }} gap="4" align="center" justify="between">
            <Flex direction="column" gap="3" style={{ flex: 1 }}>
              <Heading size="9">FindMe — найди потерянного питомца</Heading>
              <Text color="gray">
                Публикуйте объявления, общайтесь и помогайте находить домашних животных в вашем городе.
              </Text>
              <Flex gap="3">
                <Button asChild>
                  <Link to="/create-ad">Создать объявление</Link>
                </Button>
                <Button variant="soft" asChild>
                  <Link to="/search">Поиск</Link>
                </Button>
              </Flex>
            </Flex>
            <Card style={{ minWidth: 220 }}>
              <Text color="gray">Онлайн участники</Text>
              <Heading size="8">{online}</Heading>
              <Text size="2" color="gray">активных участников прямо сейчас</Text>
            </Card>
          </Flex>
        </Card>

        <Flex direction="column" gap="3">
          <Heading size="6">Последние объявления</Heading>
          <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="3">
            {ads.map((a) => (
              <Card key={a.id} asChild>
                <Link to={`/ads/${a.id}`} style={{ textDecoration: 'none' }}>
                  <Flex direction="column" gap="2">
                    <Text weight="bold">{a.petName || 'Без имени'}</Text>
                    <Text size="2" color="gray">{a.animalType || 'Неизвестно'}</Text>
                    <Flex gap="2">
                      <Badge color={a.type === 'LOST' ? 'red' : 'green'}>{a.type}</Badge>
                      <Badge color="blue">{a.status}</Badge>
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
