import { useState } from 'react';
import * as Checkbox from '@radix-ui/react-checkbox';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Container, Flex, Heading, Text, TextField } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { useAuthStore } from '../../shared/authStore';
import { extractApiErrorMessage } from '../../shared/apiError';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setUser = useAuthStore((state) => state.setUser);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    acceptTerms: false,
  });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.acceptTerms) {
      setError('Необходимо принять пользовательское соглашение');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/auth/register', form);
      const loginResponse = await api.post('/auth/login', {
        email: form.email,
        password: form.password,
      });

      setAccessToken(loginResponse.data.accessToken);
      try {
        const me = await api.get('/users/me');
        setUser(me.data);
      } catch (_ignored) {
        setUser(loginResponse.data.user ?? null);
      }
      navigate('/');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Ошибка регистрации'));
    } finally {
      setSubmitting(false);
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
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
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
              minLength={6}
            />

            <Flex align="center" gap="2">
              <Checkbox.Root
                id="acceptTerms"
                className="checkbox"
                checked={form.acceptTerms}
                onCheckedChange={(value) => setForm({ ...form, acceptTerms: Boolean(value) })}
              >
                <Checkbox.Indicator className="checkbox-indicator">✓</Checkbox.Indicator>
              </Checkbox.Root>
              <label htmlFor="acceptTerms">Я принимаю пользовательское соглашение</label>
            </Flex>

            {error && <Text color="red">{error}</Text>}

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
            <Text size="2" color="gray">
              Уже есть аккаунт? <Link to="/login">Войти</Link>
            </Text>
          </Flex>
        </form>
      </Card>
    </Container>
  );
}
