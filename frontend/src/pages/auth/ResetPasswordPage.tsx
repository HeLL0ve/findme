import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Flex, Text } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { extractApiErrorMessage } from '../../shared/apiError';
import { AuthShell } from './AuthShell';
import { PasswordField } from '../../components/common/PasswordField';

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
      setError('Ссылка для сброса пароля недействительна или устарела. Запросите новую.');
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
    <AuthShell title="Новый пароль" subtitle="Придумайте надежный пароль и подтвердите его." kicker="Безопасность" tone="orange">
      <form onSubmit={submit} className="form-root">
        <Flex direction="column" gap="3">
          <PasswordField
            placeholder="Новый пароль"
            value={newPassword}
            onChange={setNewPassword}
            required
            minLength={6}
            autoComplete="new-password"
          />
          <PasswordField
            placeholder="Повторите новый пароль"
            value={repeatPassword}
            onChange={setRepeatPassword}
            required
            minLength={6}
            autoComplete="new-password"
          />

          {error && (
            <div className="auth-alert auth-alert--error">
              <Text color="red" size="2">
                {error}
              </Text>
            </div>
          )}
          {success && (
            <div className="auth-alert auth-alert--success">
              <Text color="green" size="2">
                {success}
              </Text>
            </div>
          )}

          <Button type="submit" disabled={submitting} style={{ fontWeight: 700 }}>
            {submitting ? 'Сохраняем...' : 'Сменить пароль'}
          </Button>

          <div className="auth-links">
            <Text size="2" color="gray">
              <Link to="/login">Назад ко входу</Link>
            </Text>
          </div>
        </Flex>
      </form>
    </AuthShell>
  );
}
