import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Container, Flex, Heading, Text, TextField } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { extractApiErrorMessage } from '../../shared/apiError';
import { useAuthStore } from '../../shared/authStore';

export default function LoginPage() {
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await api.post('/auth/login', form);
      setAccessToken(response.data.accessToken);

      try {
        const me = await api.get('/users/me');
        setUser(me.data);
      } catch {
        setUser(response.data.user ?? null);
      }

      navigate('/');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Ошибка входа'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container size="2">
      <Card>
        <Heading size="7">Вход</Heading>
        <form onSubmit={onSubmit} className="form-root" style={{ marginTop: 16 }}>
          <Flex direction="column" gap="3">
            <TextField.Root
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
            <TextField.Root
              type="password"
              placeholder="Пароль"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />

            {error && <Text color="red">{error}</Text>}

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Вход...' : 'Войти'}
            </Button>
            <Text size="2" color="gray">
              Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
            </Text>
          </Flex>
        </form>
      </Card>
    </Container>
  );
}
