import * as Dialog from '@radix-ui/react-dialog';
import * as Checkbox from '@radix-ui/react-checkbox';
import { useState } from 'react';
import { api } from '../../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../shared/authStore';
import { Button, Card, Container, Flex, Heading, Text, TextField } from '@radix-ui/themes';

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    acceptTerms: false,
  });

  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.acceptTerms) {
      setError('Нужно принять пользовательское соглашение');
      return;
    }

    try {
      await api.post('/auth/register', form);
      const res = await api.post('/auth/login', { email: form.email, password: form.password });
      setAccessToken(res.data.accessToken);
      try {
        const me = await api.get('/users/me');
        setUser(me.data);
      } catch (_) {}
      navigate('/');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Ошибка регистрации');
    }
  }

  return (
    <Container size="2">
      <Card>
        <Heading size="7">Создать аккаунт</Heading>
        <form onSubmit={submit} className="form-root" style={{ marginTop: 16 }}>
          <Flex direction="column" gap="3">
            <TextField.Root
              placeholder="Имя (необязательно)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <TextField.Root
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <TextField.Root
              type="password"
              placeholder="Пароль"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />

            <Flex align="center" gap="2">
              <Checkbox.Root
                checked={form.acceptTerms}
                onCheckedChange={(v) => setForm({ ...form, acceptTerms: Boolean(v) })}
                id="accept"
                className="checkbox"
              >
                <Checkbox.Indicator className="checkbox-indicator">✓</Checkbox.Indicator>
              </Checkbox.Root>
              <label htmlFor="accept">
                Я принимаю{' '}
                <Dialog.Root>
                  <Dialog.Trigger asChild>
                    <span className="link">пользовательское соглашение</span>
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay style={{ background: 'rgba(0,0,0,0.4)', position: 'fixed', inset: 0 }} />
                    <Dialog.Content style={{ background: 'var(--surface)', padding: 20, borderRadius: 12, position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', maxWidth: 600 }}>
                      <Heading size="4">Пользовательское соглашение</Heading>
                      <div style={{ maxHeight: 340, overflow: 'auto', marginTop: 12 }}>
                        <Text>Тут будет текст соглашения...</Text>
                      </div>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              </label>
            </Flex>

            {error && <Text color="red">{error}</Text>}

            <Flex gap="2">
              <Button type="submit">Зарегистрироваться</Button>
              <Button variant="soft" asChild>
                <Link to="/login">Уже есть аккаунт</Link>
              </Button>
            </Flex>
          </Flex>
        </form>
      </Card>
    </Container>
  );
}
