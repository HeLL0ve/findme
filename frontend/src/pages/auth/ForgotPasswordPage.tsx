import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Container, Flex, Heading, Text, TextField } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { extractApiErrorMessage } from '../../shared/apiError';

export default function ForgotPasswordPage() {
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
    <Container size="2">
      <Card>
        <Heading size="7">Сброс пароля</Heading>
        <form onSubmit={submit} className="form-root" style={{ marginTop: 16 }}>
          <Flex direction="column" gap="3">
            <TextField.Root
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            {error && <Text color="red">{error}</Text>}
            {success && <Text color="green">{success}</Text>}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Отправка...' : 'Отправить ссылку'}
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
