import { useState } from 'react';
import { api } from '../../api/axios';
import { useAuthStore } from '../../shared/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Card, Container, Flex, Heading, Text, TextField } from '@radix-ui/themes';

export default function LoginPage() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', password: '' });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    try {
      const res = await api.post('/auth/login', form);
      setAccessToken(res.data.accessToken);
      try {
        const me = await api.get('/users/me');
        setUser(me.data);
      } catch (_) {}
      navigate('/');
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Ошибка входа');
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
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <TextField.Root
              type="password"
              placeholder="Пароль"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

            {error && <Text color="red">{error}</Text>}

            <Button type="submit">Войти</Button>
            <Text size="2" color="gray">
              Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
            </Text>
          </Flex>
        </form>
      </Card>
    </Container>
  );
}
