import { Card, Container, Flex, Heading, Text, Button, Grid } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../../api/axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/admin/stats');
        if (mounted) setStats(res.data);
      } catch (_) {}
    })();
    return () => { mounted = false };
  }, []);

  return (
    <Container size="3">
      <Flex direction="column" gap="4">
        <Heading size="8">Админ-панель</Heading>
        <Grid columns={{ initial: '1', md: '3' }} gap="3">
          <Card>
            <Text weight="bold">Пользователи</Text>
            <Text size="2" color="gray">Всего: {stats?.users?.total ?? '—'}</Text>
            <Text size="2" color="gray">Заблокировано: {stats?.users?.blocked ?? '—'}</Text>
          </Card>
          <Card>
            <Text weight="bold">Объявления</Text>
            <Text size="2" color="gray">PENDING: {stats?.ads?.pending ?? '—'}</Text>
            <Text size="2" color="gray">APPROVED: {stats?.ads?.approved ?? '—'}</Text>
            <Text size="2" color="gray">ARCHIVED: {stats?.ads?.archived ?? '—'}</Text>
          </Card>
          <Card>
            <Text weight="bold">Чаты</Text>
            <Text size="2" color="gray">Всего: {stats?.chats?.total ?? '—'}</Text>
            <Text size="2" color="gray">Сообщений: {stats?.chats?.messages ?? '—'}</Text>
          </Card>
        </Grid>

        <Flex gap="3" wrap="wrap">
          <Card>
            <Flex direction="column" gap="2">
              <Text weight="bold">Пользователи</Text>
              <Text size="2" color="gray">Блокировка, роли</Text>
              <Button asChild variant="soft">
                <Link to="/admin/users">Открыть</Link>
              </Button>
            </Flex>
          </Card>
          <Card>
            <Flex direction="column" gap="2">
              <Text weight="bold">Объявления</Text>
              <Text size="2" color="gray">Модерация и статусы</Text>
              <Button asChild variant="soft">
                <Link to="/admin/ads">Открыть</Link>
              </Button>
            </Flex>
          </Card>
        </Flex>
      </Flex>
    </Container>
  );
}
