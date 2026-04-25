import { useEffect, useMemo, useState } from 'react';
import { Card, Container, Flex, Grid, Heading, Select, Text, Section } from '@radix-ui/themes';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { api } from '../../api/axios';
import { extractApiErrorMessage } from '../../shared/apiError';
import { usePageTitle } from '../../shared/usePageTitle';
import { AnalyticsIcon } from '../../components/common/Icons';

type TimelinePoint = {
  date: string;
  label: string;
  users: number;
  ads: number;
  messages: number;
  complaints: number;
};

type RangeValue = 'today' | 'week' | 'month' | 'quarter';

type StatsDto = {
  users: { total: number; blocked: number };
  ads: { total: number; pending: number; approved: number; rejected: number; archived: number };
  chats: { total: number; messages: number };
  complaints: { total: number; pending: number };
  range: RangeValue;
  timeline: TimelinePoint[];
};

export default function AdminStatsPage() {
  usePageTitle('Админ — Статистика');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeValue>('week');
  const [stats, setStats] = useState<StatsDto | null>(null);

  async function load(selectedRange: RangeValue) {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/stats', { params: { range: selectedRange } });
      setStats(response.data);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось загрузить статистику'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(range);
  }, [range]);

  const statusData = useMemo(
    () => [
      { name: 'На модерации', value: stats?.ads.pending || 0 },
      { name: 'Опубликовано', value: stats?.ads.approved || 0 },
      { name: 'Отклонено', value: stats?.ads.rejected || 0 },
      { name: 'Питомцы нашлись', value: stats?.ads.archived || 0 },
    ],
    [stats?.ads.approved, stats?.ads.archived, stats?.ads.pending, stats?.ads.rejected],
  );

  const metrics = useMemo(() => {
    if (!stats) return null;

    const approvalRate = stats.ads.total > 0
      ? (((stats.ads.approved + stats.ads.archived) / stats.ads.total) * 100).toFixed(1)
      : '0';
    const blockedRate = stats.users.total > 0 ? ((stats.users.blocked / stats.users.total) * 100).toFixed(1) : '0';
    const avgMessagesPerChat = stats.chats.total > 0 ? (stats.chats.messages / stats.chats.total).toFixed(1) : '0';
    const complaintResolveRate = stats.complaints.total > 0 
      ? (((stats.complaints.total - stats.complaints.pending) / stats.complaints.total) * 100).toFixed(1) 
      : '0';

    return {
      approvalRate,
      blockedRate,
      avgMessagesPerChat,
      complaintResolveRate,
    };
  }, [stats]);

  if (loading) return <Container size="4"><Text>Загрузка...</Text></Container>;
  if (error) return <Container size="4"><Text color="red">{error}</Text></Container>;
  if (!stats) return <Container size="4"><Text color="red">Статистика недоступна</Text></Container>;

  const statusColors = {
    'На модерации': '#fbbf24',
    'Опубликовано': '#3b82f6',
    'Отклонено': '#ef4444',
    'Питомцы нашлись': '#22c55e',
  };

  return (
    <Flex direction="column" gap="0">
      {/* Header */}
      <Section size="2" style={{
        background: 'linear-gradient(135deg, var(--violet-2) 0%, var(--accent-soft) 100%)',
        borderBottom: '1px solid var(--gray-a5)',
      }}>
        <Container size="4">
          <Flex justify="between" align="center" wrap="wrap" gap="3">
            <Heading size="8" weight="bold">
              <Flex align="center" gap="3">
                <AnalyticsIcon width={32} height={32} color="var(--violet-11)" />
                Аналитика
              </Flex>
            </Heading>
            <Select.Root value={range} onValueChange={(value) => setRange(value as RangeValue)}>
              <Select.Trigger placeholder="Выберите период" />
              <Select.Content>
                <Select.Item value="today">Сегодня</Select.Item>
                <Select.Item value="week">Неделя</Select.Item>
                <Select.Item value="month">Месяц</Select.Item>
                <Select.Item value="quarter">Квартал</Select.Item>
              </Select.Content>
            </Select.Root>
          </Flex>
        </Container>
      </Section>

      <Container size="4" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
        <Flex direction="column" gap="6">
          {/* Key Metrics */}
          <Flex direction="column" gap="3">
            <Heading size="5" weight="bold">Ключевые метрики</Heading>
            <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="4">
              <Card style={{
                background: 'linear-gradient(135deg, var(--violet-a2) 0%, var(--violet-a1) 100%)',
                border: '1px solid var(--violet-a6)',
              }}>
                <Flex direction="column" gap="2">
                  <Text size="1" weight="bold" color="gray">Процент одобренных объявлений</Text>
                  <Heading size="7" style={{ color: 'var(--violet-11)' }}>
                    {metrics?.approvalRate}%
                  </Heading>
                  <Text size="1" color="gray">
                    {stats.ads.approved + stats.ads.archived} из {stats.ads.total} объявлений (одобр. + найдены)
                  </Text>
                </Flex>
              </Card>

              <Card style={{
                background: 'linear-gradient(135deg, var(--blue-a2) 0%, var(--blue-a1) 100%)',
                border: '1px solid var(--blue-a6)',
              }}>
                <Flex direction="column" gap="2">
                  <Text size="1" weight="bold" color="gray">Сообщений на чат (среднее)</Text>
                  <Heading size="7" style={{ color: 'var(--blue-11)' }}>
                    {metrics?.avgMessagesPerChat}
                  </Heading>
                  <Text size="1" color="gray">
                    {stats.chats.messages} / {stats.chats.total} чатов
                  </Text>
                </Flex>
              </Card>

              <Card style={{
                background: `linear-gradient(135deg, var(--${stats.users.blocked > 0 ? 'red' : 'green'}-a2) 0%, var(--${stats.users.blocked > 0 ? 'red' : 'green'}-a1) 100%)`,
                border: `1px solid var(--${stats.users.blocked > 0 ? 'red' : 'green'}-a6)`,
              }}>
                <Flex direction="column" gap="2">
                  <Text size="1" weight="bold" color="gray">Заблокировано</Text>
                  <Heading size="7" style={{ color: `var(--${stats.users.blocked > 0 ? 'red' : 'green'}-11)` }}>
                    {metrics?.blockedRate}%
                  </Heading>
                  <Text size="1" color="gray">
                    {stats.users.blocked} из {stats.users.total} пользователей
                  </Text>
                </Flex>
              </Card>

              <Card style={{
                background: 'linear-gradient(135deg, var(--orange-a2) 0%, var(--orange-a1) 100%)',
                border: '1px solid var(--orange-a6)',
              }}>
                <Flex direction="column" gap="2">
                  <Text size="1" weight="bold" color="gray">Рассмотренные жалобы</Text>
                  <Heading size="7" style={{ color: 'var(--orange-11)' }}>
                    {metrics?.complaintResolveRate}%
                  </Heading>
                  <Text size="1" color="gray">
                    Решено: {stats.complaints.total - stats.complaints.pending}, новых: {stats.complaints.pending}
                  </Text>
                </Flex>
              </Card>
            </Grid>
          </Flex>

          {/* Graphs */}
          <Flex direction="column" gap="3">
            <Heading size="5" weight="bold">Динамика активности</Heading>
            <Card style={{ padding: 'var(--space-4)' }}>
              <div style={{ width: '100%', height: 380 }}>
                <ResponsiveContainer>
                  <LineChart data={stats.timeline} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorAds" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a5)" />
                    <XAxis dataKey="label" stroke="var(--gray-a8)" />
                    <YAxis stroke="var(--gray-a8)" />
                    <Tooltip contentStyle={{
                      background: 'var(--gray-2)',
                      border: '1px solid var(--gray-a6)',
                      borderRadius: '8px',
                    }} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line type="monotone" dataKey="ads" stroke="#7c3aed" name="Объявления" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="messages" stroke="#2563eb" name="Сообщения" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="complaints" stroke="#ea580c" name="Жалобы" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="users" stroke="#059669" name="Регистрации" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Flex>

          {/* Status Pie Chart */}
          <Flex direction="column" gap="3">
            <Heading size="5" weight="bold">Распределение статусов объявлений</Heading>
            <Card style={{ padding: 'var(--space-4)' }}>
              <Flex direction={{ initial: 'column', sm: 'row' }} align="center" gap="6">
                <div style={{ width: '100%', maxWidth: 320, height: 280 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        paddingAngle={0}
                        strokeWidth={0}
                      >
                        {statusData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={statusColors[entry.name as keyof typeof statusColors] || '#7c3aed'}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'var(--gray-2)',
                          border: '1px solid var(--gray-a6)',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number, name: string) => [value, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <Flex direction="column" gap="3" style={{ flex: 1 }}>
                  {statusData.map((entry) => {
                    const color = statusColors[entry.name as keyof typeof statusColors] || '#7c3aed';
                    const total = statusData.reduce((sum, d) => sum + d.value, 0);
                    const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
                    return (
                      <Flex key={entry.name} align="center" justify="between" gap="3">
                        <Flex align="center" gap="2">
                          <div style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: color,
                            flexShrink: 0,
                          }} />
                          <Text size="2">{entry.name}</Text>
                        </Flex>
                        <Flex align="center" gap="2">
                          <Text size="2" weight="bold">{entry.value}</Text>
                          <Text size="1" color="gray">({pct}%)</Text>
                        </Flex>
                      </Flex>
                    );
                  })}
                </Flex>
              </Flex>
            </Card>
          </Flex>

          {/* Summary Stats */}
          <Flex direction="column" gap="3">
            <Heading size="5" weight="bold">Общая статистика</Heading>
            <Grid columns={{ initial: '2', md: '4' }} gap="3">
              {[
                { label: 'Всего пользователей', value: stats.users.total, color: 'var(--blue-a2)' },
                { label: 'Всего объявлений', value: stats.ads.total, color: 'var(--green-a2)' },
                { label: 'Питомцев вернулись домой', value: stats.ads.archived, color: 'var(--amber-a2)' },
                { label: 'Активных чатов', value: stats.chats.total, color: 'var(--purple-a2)' },
                { label: 'Жалоб и обращений', value: stats.complaints.total, color: 'var(--orange-a2)' },
                { label: 'На модерации', value: stats.ads.pending, color: 'var(--yellow-a2)' },
                { label: 'Отклонено', value: stats.ads.rejected, color: 'var(--red-a2)' },
                { label: 'Всего сообщений', value: stats.chats.messages, color: 'var(--cyan-a2)' },
              ].map((item, idx) => (
                <Card key={idx} style={{ background: item.color, border: '1px solid var(--gray-a6)' }}>
                  <Flex direction="column" gap="2" align="center">
                    <Heading size="6" weight="bold">
                      {item.value}
                    </Heading>
                    <Text size="1" color="gray" style={{ textAlign: 'center' }}>
                      {item.label}
                    </Text>
                  </Flex>
                </Card>
              ))}
            </Grid>
          </Flex>
        </Flex>
      </Container>
    </Flex>
  );
}
