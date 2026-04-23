import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Flex, Text, TextField } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { extractApiErrorMessage } from '../../shared/apiError';
import { useAuthStore } from '../../shared/authStore';
import { AuthShell } from './AuthShell';
import { PasswordField } from '../../components/common/PasswordField';

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
      if (code === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerification(true);
        setError('Подтвердите email перед входом. Отправить письмо повторно ?');
      } else if (code === 'INVALID_CREDENTIALS') {
        setError('Неверный email или пароль');
      } else {
        const message = extractApiErrorMessage(err, 'Ошибка входа');
        setError(/token/i.test(message) ? 'Неверный email или пароль' : message);
      }
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
    <AuthShell title="Вход" subtitle="Добро пожаловать обратно. Войдите, чтобы продолжить." kicker="Аккаунт" tone="violet">
      <form onSubmit={onSubmit} className="form-root">
        <Flex direction="column" gap="3">
          {registeredMessage && (
            <div className="auth-alert auth-alert--success">
              <Text color="green" size="2">
                {registeredMessage}
              </Text>
            </div>
          )}

          <TextField.Root
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
          <PasswordField
            placeholder="Пароль"
            value={form.password}
            onChange={(password) => setForm({ ...form, password })}
            required
            autoComplete="current-password"
          />

          {error && (
            <div className="auth-alert auth-alert--error">
              <Text color="red" size="2">
                {error}
              </Text>
            </div>
          )}
          {resendMessage && (
            <div className="auth-alert auth-alert--success">
              <Text color="green" size="2">
                {resendMessage}
              </Text>
            </div>
          )}

          <Button type="submit" disabled={submitting} style={{ fontWeight: 700 }}>
            {submitting ? 'Вход...' : 'Войти'}
          </Button>

          {needsVerification && (
            <Button
              type="button"
              variant="soft"
              onClick={() => void resendVerification()}
              disabled={resending}
              style={{ fontWeight: 700 }}
            >
              {resending ? 'Отправка...' : 'Отправить письмо подтверждения еще раз'}
            </Button>
          )}

          <div className="auth-links">
            <Text size="2" color="gray">
              <Link to="/forgot-password">Забыли пароль?</Link>
            </Text>
            <Text size="2" color="gray">
              Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
            </Text>
          </div>
        </Flex>
      </form>
    </AuthShell>
  );
}
