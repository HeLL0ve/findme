import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Container, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { api } from '../../api/axios';

type AdminStats = {
  users?: { total: number; blocked: number };
  ads?: { total: number; pending: number; approved: number; rejected: number; archived: number };
  chats?: { total: number; messages: number };
  complaints?: { total: number; pending: number };
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await api.get('/admin/stats');
        if (!mounted) return;
        setStats(response.data);
      } catch {
        // оставляем панель доступной по ссылкам даже без статистики
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Container size="4">
      <Flex direction="column" gap="4">
        <Heading size="8">Админ-панель</Heading>

        <Grid columns={{ initial: '1', md: '4' }} gap="3">
          <Card>
            <Text weight="bold">Пользователи</Text>
            <Text size="2" color="gray">Всего: {stats?.users?.total ?? '—'}</Text>
            <Text size="2" color="gray">Заблокировано: {stats?.users?.blocked ?? '—'}</Text>
          </Card>
          <Card>
            <Text weight="bold">Объявления</Text>
            <Text size="2" color="gray">На модерации: {stats?.ads?.pending ?? '—'}</Text>
            <Text size="2" color="gray">Опубликовано: {stats?.ads?.approved ?? '—'}</Text>
            <Text size="2" color="gray">В архиве: {stats?.ads?.archived ?? '—'}</Text>
          </Card>
          <Card>
            <Text weight="bold">Чаты</Text>
            <Text size="2" color="gray">Всего: {stats?.chats?.total ?? '—'}</Text>
            <Text size="2" color="gray">Сообщений: {stats?.chats?.messages ?? '—'}</Text>
          </Card>
          <Card>
            <Text weight="bold">Жалобы и обращения</Text>
            <Text size="2" color="gray">Всего: {stats?.complaints?.total ?? '—'}</Text>
            <Text size="2" color="gray">Новые: {stats?.complaints?.pending ?? '—'}</Text>
          </Card>
        </Grid>

        <Grid columns={{ initial: '1', md: '2', lg: '4' }} gap="3">
          <Card>
            <Flex direction="column" gap="2">
              <Text weight="bold">Пользователи</Text>
              <Text size="2" color="gray">Блокировка, восстановление и роли</Text>
              <Button asChild variant="soft">
                <Link to="/admin/users">Открыть</Link>
              </Button>
            </Flex>
          </Card>
          <Card>
            <Flex direction="column" gap="2">
              <Text weight="bold">Объявления</Text>
              <Text size="2" color="gray">Модерация, архивирование, возврат</Text>
              <Button asChild variant="soft">
                <Link to="/admin/ads">Открыть</Link>
              </Button>
            </Flex>
          </Card>
          <Card>
            <Flex direction="column" gap="2">
              <Text weight="bold">Жалобы и поддержка</Text>
              <Text size="2" color="gray">Рассмотрение обращений пользователей</Text>
              <Button asChild variant="soft">
                <Link to="/admin/complaints">Открыть</Link>
              </Button>
            </Flex>
          </Card>
          <Card>
            <Flex direction="column" gap="2">
              <Text weight="bold">Админ статистика</Text>
              <Text size="2" color="gray">Графики и динамика по системе</Text>
              <Flex align="center" gap="2" wrap="wrap">
                <Badge color="violet">Новая вкладка</Badge>
              </Flex>
              <Button asChild variant="soft">
                <Link to="/admin/stats">Открыть</Link>
              </Button>
            </Flex>
          </Card>
        </Grid>
      </Flex>
    </Container>
  );
}
