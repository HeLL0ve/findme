import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Container, Flex, Grid, Heading, Text, Section } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { usePageTitle } from '../../shared/usePageTitle';

type AdminStats = {
  users?: { total: number; blocked: number };
  ads?: { total: number; pending: number; approved: number; rejected: number; archived: number };
  chats?: { total: number; messages: number };
  complaints?: { total: number; pending: number };
};

export default function AdminDashboard() {
  usePageTitle('Админ — Дашборд');
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
    <Flex direction="column" gap="0">
      {/* Header */}
      <Section size="2" style={{
        background: 'linear-gradient(135deg, var(--violet-2) 0%, var(--accent-soft) 100%)',
        borderBottom: '1px solid var(--gray-a5)',
      }}>
        <Container size="4">
          <Heading size="8" weight="bold">⚙️ Админ-панель</Heading>
          <Text color="gray" size="2">Управление пользователями, объявлениями, чатами и жалобами</Text>
        </Container>
      </Section>

      <Container size="4" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
        <Flex direction="column" gap="6">
          {/* Статистика */}
          <Flex direction="column" gap="3">
            <Heading size="5" weight="bold">Статистика платформы</Heading>
            <Grid columns={{ initial: '1', md: '2', lg: '4' }} gap="4">
              <Card style={{
                background: 'linear-gradient(135deg, var(--blue-a2) 0%, var(--blue-a1) 100%)',
                border: '1px solid var(--blue-a6)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <Flex justify="between" align="start" gap="3">
                  <Flex direction="column" gap="2" style={{ flex: 1 }}>
                    <Text size="1" weight="bold" color="gray">ПОЛЬЗОВАТЕЛИ</Text>
                    <Heading size="6" style={{ color: 'var(--blue-11)' }}>
                      {stats?.users?.total ?? '—'}
                    </Heading>
                    <Text size="2" color="gray">
                      Заблокировано: <span style={{ fontWeight: 600, color: 'var(--red-9)' }}>{stats?.users?.blocked ?? '—'}</span>
                    </Text>
                  </Flex>
                  <div style={{ opacity: 0.2, fontSize: '48px' }}>👥</div>
                </Flex>
              </Card>

              <Card style={{
                background: 'linear-gradient(135deg, var(--green-a2) 0%, var(--green-a1) 100%)',
                border: '1px solid var(--green-a6)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <Flex justify="between" align="start" gap="3">
                  <Flex direction="column" gap="2" style={{ flex: 1 }}>
                    <Text size="1" weight="bold" color="gray">ОБЪЯВЛЕНИЯ</Text>
                    <Heading size="6" style={{ color: 'var(--green-11)' }}>
                      {stats?.ads?.total ?? '—'}
                    </Heading>
                    <Flex direction="column" gap="1">
                      <Text size="1" color="gray">
                        На модер.: <span style={{ fontWeight: 600, color: 'var(--amber-9)' }}>{stats?.ads?.pending ?? '—'}</span>
                      </Text>
                      <Text size="1" color="gray">
                        Опубл.: <span style={{ fontWeight: 600 }}>{stats?.ads?.approved ?? '—'}</span>
                      </Text>
                    </Flex>
                  </Flex>
                  <div style={{ opacity: 0.2, fontSize: '48px' }}>📋</div>
                </Flex>
              </Card>

              <Card style={{
                background: 'linear-gradient(135deg, var(--purple-a2) 0%, var(--purple-a1) 100%)',
                border: '1px solid var(--purple-a6)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <Flex justify="between" align="start" gap="3">
                  <Flex direction="column" gap="2" style={{ flex: 1 }}>
                    <Text size="1" weight="bold" color="gray">ЧАТЫ</Text>
                    <Heading size="6" style={{ color: 'var(--purple-11)' }}>
                      {stats?.chats?.total ?? '—'}
                    </Heading>
                    <Text size="2" color="gray">
                      Сообщений: <span style={{ fontWeight: 600 }}>{stats?.chats?.messages ?? '—'}</span>
                    </Text>
                  </Flex>
                  <div style={{ opacity: 0.2, fontSize: '48px' }}>💬</div>
                </Flex>
              </Card>

              <Card style={{
                background: 'linear-gradient(135deg, var(--orange-a2) 0%, var(--orange-a1) 100%)',
                border: '1px solid var(--orange-a6)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <Flex justify="between" align="start" gap="3">
                  <Flex direction="column" gap="2" style={{ flex: 1 }}>
                    <Text size="1" weight="bold" color="gray">ЖАЛОБЫ И ОБРАЩЕНИЯ</Text>
                    <Heading size="6" style={{ color: 'var(--orange-11)' }}>
                      {stats?.complaints?.total ?? '—'}
                    </Heading>
                    <Text size="2" color="gray">
                      Новые: <span style={{ fontWeight: 600, color: 'var(--red-9)' }}>{stats?.complaints?.pending ?? '—'}</span>
                    </Text>
                  </Flex>
                  <div style={{ opacity: 0.2, fontSize: '48px' }}>⚠️</div>
                </Flex>
              </Card>
            </Grid>
          </Flex>

          {/* Главные управление */}
          <Flex direction="column" gap="3">
            <Heading size="5" weight="bold">Управление</Heading>
            <Grid columns={{ initial: '1', md: '2', lg: '4' }} gap="4">
              <Card style={{
                transition: 'all 0.2s ease',
                position: 'relative',
                border: '1px solid var(--gray-a5)',
              }} onMouseEnter={(e) => {
                const card = e.currentTarget as HTMLElement;
                card.style.transform = 'translateY(-4px)';
                card.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.12)';
              }} onMouseLeave={(e) => {
                const card = e.currentTarget as HTMLElement;
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '';
              }}>
                <Flex direction="column" gap="3">
                  <Flex align="center" gap="3">
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'var(--blue-a3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      👥
                    </div>
                    <Heading size="3">Пользователи</Heading>
                  </Flex>
                  <Text size="2" color="gray">
                    Блокировка, восстановление и управление ролями
                  </Text>
                  <Button asChild variant="soft">
                    <Link to="/admin/users">Открыть →</Link>
                  </Button>
                </Flex>
              </Card>

              <Card style={{
                transition: 'all 0.2s ease',
                position: 'relative',
                border: '1px solid var(--gray-a5)',
              }} onMouseEnter={(e) => {
                const card = e.currentTarget as HTMLElement;
                card.style.transform = 'translateY(-4px)';
                card.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.12)';
              }} onMouseLeave={(e) => {
                const card = e.currentTarget as HTMLElement;
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '';
              }}>
                <Flex direction="column" gap="3">
                  <Flex align="center" gap="3">
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'var(--green-a3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      📋
                    </div>
                    <Heading size="3">Объявления</Heading>
                  </Flex>
                  <Text size="2" color="gray">
                    Модерация, архивирование и восстановление объявлений
                  </Text>
                  <Button asChild variant="soft">
                    <Link to="/admin/ads">Открыть →</Link>
                  </Button>
                </Flex>
              </Card>

              <Card style={{
                transition: 'all 0.2s ease',
                position: 'relative',
                border: '1px solid var(--gray-a5)',
              }} onMouseEnter={(e) => {
                const card = e.currentTarget as HTMLElement;
                card.style.transform = 'translateY(-4px)';
                card.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.12)';
              }} onMouseLeave={(e) => {
                const card = e.currentTarget as HTMLElement;
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '';
              }}>
                <Flex direction="column" gap="3">
                  <Flex align="center" gap="3">
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'var(--orange-a3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      ⚠️
                    </div>
                    <Heading size="3">Жалобы и поддержка</Heading>
                  </Flex>
                  <Text size="2" color="gray">
                    Рассмотрение и обработка обращений и поддержки
                  </Text>
                  <Flex gap="2">
                    <Button asChild variant="soft" style={{ flex: 1 }}>
                      <Link to="/admin/complaints">Жалобы →</Link>
                    </Button>
                    <Button asChild variant="soft" style={{ flex: 1 }}>
                      <Link to="/admin/support">Поддержка →</Link>
                    </Button>
                  </Flex>
                </Flex>
              </Card>

              <Card style={{
                transition: 'all 0.2s ease',
                position: 'relative',
                border: '1px solid var(--gray-a5)',
              }} onMouseEnter={(e) => {
                const card = e.currentTarget as HTMLElement;
                card.style.transform = 'translateY(-4px)';
                card.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.12)';
              }} onMouseLeave={(e) => {
                const card = e.currentTarget as HTMLElement;
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '';
              }}>
                <Flex direction="column" gap="3">
                  <Flex align="center" gap="3">
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'var(--purple-a3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      📊
                    </div>
                    <Heading size="3">Аналитика</Heading>
                  </Flex>
                  <Text size="2" color="gray">
                    Подробные графики, метрики и динамика системы
                  </Text>
                  <Button asChild variant="soft">
                    <Link to="/admin/stats">Открыть →</Link>
                  </Button>
                </Flex>
              </Card>
            </Grid>
          </Flex>
        </Flex>
      </Container>
    </Flex>
  );
}
