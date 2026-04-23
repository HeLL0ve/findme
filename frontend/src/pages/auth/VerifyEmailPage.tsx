import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Flex, Text, TextField } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { extractApiErrorMessage } from '../../shared/apiError';
import { AuthShell } from './AuthShell';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const emailParam = searchParams.get('email') ?? '';

  const [email, setEmail] = useState(emailParam);
  const [loading, setLoading] = useState(Boolean(token));
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!token) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        await api.post('/auth/verify-email', { token });
        if (!mounted) return;
        setSuccess('Email успешно подтвержден. Теперь можно войти.');
      } catch (err) {
        if (!mounted) return;
        setError(extractApiErrorMessage(err, 'Не удалось подтвердить email'));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token]);

  async function resend() {
    if (!email.trim()) {
      setError('Введите email');
      return;
    }

    setResending(true);
    setError(null);
    try {
      await api.post('/auth/resend-verification', { email: email.trim() });
      setSuccess('Письмо отправлено повторно. Проверьте почту.');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось отправить письмо повторно'));
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell
      title="Подтверждение email"
      subtitle="Проверяем ссылку или можем отправить письмо повторно."
      kicker="Подтверждение"
      tone="blue"
    >
      <Flex direction="column" gap="3">
        {loading && (
          <div className="auth-alert">
            <Text size="2">Проверяем ссылку...</Text>
          </div>
        )}
        {!loading && success && (
          <div className="auth-alert auth-alert--success">
            <Text color="green" size="2">
              {success}
            </Text>
          </div>
        )}
        {!loading && error && (
          <div className="auth-alert auth-alert--error">
            <Text color="red" size="2">
              {error}
            </Text>
          </div>
        )}

        <TextField.Root
          type="email"
          placeholder="Email для повторной отправки"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Button type="button" variant="soft" onClick={() => void resend()} disabled={resending} style={{ fontWeight: 700 }}>
          {resending ? 'Отправка...' : 'Отправить письмо повторно'}
        </Button>

        <div className="auth-links">
          <Text size="2" color="gray">
            <Link to="/login">Перейти ко входу</Link>
          </Text>
        </div>
      </Flex>
    </AuthShell>
  );
}
