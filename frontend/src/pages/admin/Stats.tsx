import { useEffect, useMemo, useState } from 'react';
import { Badge, Card, Container, Flex, Heading, Select, Text } from '@radix-ui/themes';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../../api/axios';
import { extractApiErrorMessage } from '../../shared/apiError';

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
      { name: 'В архиве', value: stats?.ads.archived || 0 },
    ],
    [stats?.ads.approved, stats?.ads.archived, stats?.ads.pending, stats?.ads.rejected],
  );

  if (loading) return <Container size="4"><Text>Загрузка...</Text></Container>;
  if (error) return <Container size="4"><Text color="red">{error}</Text></Container>;
  if (!stats) return <Container size="4"><Text color="red">Статистика недоступна</Text></Container>;

  return (
    <Container size="4">
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center" wrap="wrap" gap="2">
          <Heading size="8">Админ статистика</Heading>
          <Flex align="center" gap="2" wrap="wrap">
            <Select.Root value={range} onValueChange={(value) => setRange(value as RangeValue)}>
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="today">Сегодня</Select.Item>
                <Select.Item value="week">Неделя</Select.Item>
                <Select.Item value="month">Месяц</Select.Item>
                <Select.Item value="quarter">Квартал</Select.Item>
              </Select.Content>
            </Select.Root>
            <Badge color="violet">Пользователи: {stats.users.total}</Badge>
            <Badge color="blue">Объявления: {stats.ads.total}</Badge>
            <Badge color="gray">Чаты: {stats.chats.total}</Badge>
            <Badge color="orange">Жалобы/обращения: {stats.complaints.total}</Badge>
          </Flex>
        </Flex>

        <Card>
          <Heading size="5">Динамика активности</Heading>
          <div style={{ width: '100%', height: 340, marginTop: 12 }}>
            <ResponsiveContainer>
              <LineChart data={stats.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ads" stroke="#7c3aed" name="Объявления" strokeWidth={2} />
                <Line type="monotone" dataKey="messages" stroke="#2563eb" name="Сообщения" strokeWidth={2} />
                <Line type="monotone" dataKey="complaints" stroke="#ea580c" name="Жалобы/обращения" strokeWidth={2} />
                <Line type="monotone" dataKey="users" stroke="#059669" name="Регистрации" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <Heading size="5">Статусы объявлений</Heading>
          <div style={{ width: '100%', height: 300, marginTop: 12 }}>
            <ResponsiveContainer>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Количество" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Flex>
    </Container>
  );
}
