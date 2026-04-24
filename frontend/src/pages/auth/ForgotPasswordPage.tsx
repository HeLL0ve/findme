import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Flex, Text, TextField } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { extractApiErrorMessage } from '../../shared/apiError';
import { AuthShell } from './AuthShell';
import { usePageTitle } from '../../shared/usePageTitle';

export default function ForgotPasswordPage() {
  usePageTitle('Восстановление пароля');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess('Если email существует, мы отправили ссылку для сброса пароля.');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось отправить письмо'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Сброс пароля"
      subtitle="Отправим ссылку для восстановления, если email существует."
      kicker="Восстановление"
      tone="orange"
    >
      <form onSubmit={submit} className="form-root">
        <Flex direction="column" gap="3">
          <TextField.Root
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
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
            {submitting ? 'Отправка...' : 'Отправить ссылку'}
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
