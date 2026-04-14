import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Card, Container, Flex, Heading, Text, TextField } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { extractApiErrorMessage } from '../../shared/apiError';

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
    <Container size="2">
      <Card>
        <Heading size="7">Подтверждение email</Heading>
        <Flex direction="column" gap="3" mt="4">
          {loading && <Text>Проверяем ссылку...</Text>}
          {!loading && success && <Text color="green">{success}</Text>}
          {!loading && error && <Text color="red">{error}</Text>}

          <TextField.Root
            type="email"
            placeholder="Email для повторной отправки"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button type="button" variant="soft" onClick={() => void resend()} disabled={resending}>
            {resending ? 'Отправка...' : 'Отправить письмо повторно'}
          </Button>
          <Text size="2">
            <Link to="/login">Перейти ко входу</Link>
          </Text>
        </Flex>
      </Card>
    </Container>
  );
}
