import { useEffect, useState } from 'react';
import { api } from '../api/axios';
import { useAuthStore } from '../shared/authStore';
import { Button, Card, Container, Flex, Heading, Text, TextField } from '@radix-ui/themes';
import * as Checkbox from '@radix-ui/react-checkbox';

type ProfileDto = {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  telegramUsername?: string | null;
  role: 'USER' | 'ADMIN';
  notificationSettings?: {
    notifyWeb: boolean;
    notifyTelegram: boolean;
  } | null;
};

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<ProfileDto>>({});
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/users/me');
        if (!mounted) return;
        setForm(res.data);
        setUser(res.data);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Ошибка');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false };
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api.put('/users/me', {
        name: form.name,
        phone: form.phone,
        telegramUsername: form.telegramUsername,
        notifyWeb: form.notificationSettings?.notifyWeb,
        notifyTelegram: form.notificationSettings?.notifyTelegram,
      });
      setForm(res.data);
      setUser(res.data as any);
      alert('Сохранено');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Ошибка сохранения');
    }
  }

  if (loading) return <Container size="2"><Text>Загрузка...</Text></Container>;

  return (
    <Container size="2">
      <Card>
        <Heading size="7">Профиль</Heading>

        {error && <Text color="red">{error}</Text>}

        <form onSubmit={save} className="form-root" style={{ marginTop: 16 }}>
          <Flex direction="column" gap="3">
            <div>
              <Text size="2" color="gray">Email</Text>
              <Text>{form.email}</Text>
            </div>

            <TextField.Root placeholder="Имя" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField.Root placeholder="Телефон" value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <TextField.Root placeholder="Telegram" value={form.telegramUsername ?? ''} onChange={(e) => setForm({ ...form, telegramUsername: e.target.value })} />

            <Flex direction="column" gap="2">
              <Text size="2" color="gray">Уведомления</Text>
              <Flex align="center" gap="2">
                <Checkbox.Root
                  checked={!!form.notificationSettings?.notifyWeb}
                  onCheckedChange={(v) => setForm({
                    ...form,
                    notificationSettings: {
                      notifyWeb: Boolean(v),
                      notifyTelegram: Boolean(form.notificationSettings?.notifyTelegram),
                    },
                  })}
                  id="notifyWeb"
                  className="checkbox"
                >
                  <Checkbox.Indicator className="checkbox-indicator">✓</Checkbox.Indicator>
                </Checkbox.Root>
                <label htmlFor="notifyWeb">Веб-уведомления</label>
              </Flex>
              <Flex align="center" gap="2">
                <Checkbox.Root
                  checked={!!form.notificationSettings?.notifyTelegram}
                  onCheckedChange={(v) => setForm({
                    ...form,
                    notificationSettings: {
                      notifyWeb: Boolean(form.notificationSettings?.notifyWeb),
                      notifyTelegram: Boolean(v),
                    },
                  })}
                  id="notifyTg"
                  className="checkbox"
                >
                  <Checkbox.Indicator className="checkbox-indicator">✓</Checkbox.Indicator>
                </Checkbox.Root>
                <label htmlFor="notifyTg">Telegram-уведомления</label>
              </Flex>
            </Flex>

            <Text size="2">Роль: {form.role}</Text>

            <Button type="submit">Сохранить</Button>
          </Flex>
        </form>
      </Card>
    </Container>
  );
}
