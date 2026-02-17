import { useEffect, useState } from 'react';
import { Badge, Button, Card, Container, Flex, Heading, Text, TextArea, TextField } from '@radix-ui/themes';
import { api } from '../api/axios';
import { extractApiErrorMessage } from '../shared/apiError';
import { complaintStatusLabel } from '../shared/labels';

type SupportRequest = {
  id: string;
  kind: 'REPORT' | 'SUPPORT';
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  reason: string;
  description?: string | null;
  reviewComment?: string | null;
  createdAt: string;
};

export default function SupportPage() {
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [requests, setRequests] = useState<SupportRequest[]>([]);

  async function loadRequests() {
    try {
      const response = await api.get('/complaints/my', { params: { kind: 'SUPPORT' } });
      setRequests(response.data);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось загрузить обращения'));
    }
  }

  useEffect(() => {
    void loadRequests();
  }, []);

  async function submitSupportRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (topic.trim().length < 5) {
      setError('Тема обращения должна быть не менее 5 символов');
      return;
    }
    if (message.trim().length < 10) {
      setError('Сообщение должно быть не менее 10 символов');
      return;
    }

    setLoading(true);
    try {
      await api.post('/complaints', {
        kind: 'SUPPORT',
        targetType: 'NONE',
        reason: topic,
        description: message,
      });

      setTopic('');
      setMessage('');
      setSuccess('Обращение отправлено в поддержку');
      await loadRequests();
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось отправить обращение'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container size="3">
      <Flex direction="column" gap="4">
        <Heading size="8">Поддержка</Heading>

        <Card>
          <Heading size="5">Новое обращение</Heading>
          <form onSubmit={submitSupportRequest} className="form-root" style={{ marginTop: 12 }}>
            <TextField.Root
              placeholder="Тема обращения"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
            />
            <TextArea
              placeholder="Опишите вопрос или проблему"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <Button type="submit" disabled={loading}>
              {loading ? 'Отправка...' : 'Отправить'}
            </Button>
            {error && <Text color="red">{error}</Text>}
            {success && <Text color="green">{success}</Text>}
          </form>
        </Card>

        <Flex direction="column" gap="2">
          <Heading size="5">История обращений</Heading>
          {requests.length === 0 && <Text color="gray">Обращений пока нет.</Text>}
          {requests.map((request) => (
            <Card key={request.id}>
              <Flex direction="column" gap="2">
                <Flex align="center" justify="between" wrap="wrap" gap="2">
                  <Text weight="bold" className="truncate">{request.reason}</Text>
                  <Badge color={request.status === 'PENDING' ? 'orange' : request.status === 'RESOLVED' ? 'green' : 'gray'}>
                    {complaintStatusLabel(request.status)}
                  </Badge>
                </Flex>
                {request.description && <Text size="2">{request.description}</Text>}
                {request.reviewComment && (
                  <Card variant="surface">
                    <Text size="2" color="gray">Ответ администрации</Text>
                    <Text size="2">{request.reviewComment}</Text>
                  </Card>
                )}
                <Text size="1" color="gray">{new Date(request.createdAt).toLocaleString()}</Text>
              </Flex>
            </Card>
          ))}
        </Flex>
      </Flex>
    </Container>
  );
}
