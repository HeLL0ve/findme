import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card, Container, Flex, Heading, Text, TextField } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { extractApiErrorMessage } from '../../shared/apiError';
import { useAuthStore } from '../../shared/authStore';

export default function LoginPage() {
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [form, setForm] = useState({
    email: searchParams.get('email') ?? '',
    password: '',
  });

  const registeredMessage = useMemo(() => {
    if (searchParams.get('registered') !== '1') return null;
    return 'Аккаунт создан. Проверьте почту и подтвердите email перед входом.';
  }, [searchParams]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResendMessage(null);
    setNeedsVerification(false);
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
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
      if (code === 'EMAIL_NOT_VERIFIED') setNeedsVerification(true);
      setError(extractApiErrorMessage(err, 'Ошибка входа'));
    } finally {
      setSubmitting(false);
    }
  }

  async function resendVerification() {
    if (!form.email) {
      setError('Введите email, чтобы отправить письмо повторно');
      return;
    }

    setResending(true);
    setError(null);
    setResendMessage(null);
    try {
      await api.post('/auth/resend-verification', { email: form.email });
      setResendMessage('Письмо отправлено повторно. Проверьте почту.');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось отправить письмо повторно'));
    } finally {
      setResending(false);
    }
  }

  return (
    <Container size="2">
      <Card>
        <Heading size="7">Вход</Heading>
        <form onSubmit={onSubmit} className="form-root" style={{ marginTop: 16 }}>
          <Flex direction="column" gap="3">
            {registeredMessage && <Text color="green">{registeredMessage}</Text>}
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
            {resendMessage && <Text color="green">{resendMessage}</Text>}

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Вход...' : 'Войти'}
            </Button>

            {needsVerification && (
              <Button type="button" variant="soft" onClick={() => void resendVerification()} disabled={resending}>
                {resending ? 'Отправка...' : 'Отправить письмо подтверждения еще раз'}
              </Button>
            )}

            <Text size="2" color="gray">
              <Link to="/forgot-password">Забыли пароль?</Link>
            </Text>
            <Text size="2" color="gray">
              Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
            </Text>
          </Flex>
        </form>
      </Card>
    </Container>
  );
}
