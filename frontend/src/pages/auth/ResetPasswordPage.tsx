import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card, Container, Flex, Heading, Text, TextField } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { extractApiErrorMessage } from '../../shared/apiError';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError('Токен сброса не найден в ссылке');
      return;
    }
    if (newPassword.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }
    if (newPassword !== repeatPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setSuccess('Пароль обновлен. Перенаправляем на страницу входа...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось сбросить пароль'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container size="2">
      <Card>
        <Heading size="7">Новый пароль</Heading>
        <form onSubmit={submit} className="form-root" style={{ marginTop: 16 }}>
          <Flex direction="column" gap="3">
            <TextField.Root
              type="password"
              placeholder="Новый пароль"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
            <TextField.Root
              type="password"
              placeholder="Повторите новый пароль"
              value={repeatPassword}
              onChange={(event) => setRepeatPassword(event.target.value)}
              required
            />
            {error && <Text color="red">{error}</Text>}
            {success && <Text color="green">{success}</Text>}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Сохраняем...' : 'Сменить пароль'}
            </Button>
            <Text size="2">
              <Link to="/login">Назад ко входу</Link>
            </Text>
          </Flex>
        </form>
      </Card>
    </Container>
  );
}
