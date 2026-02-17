import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Container, Flex, Heading, Select, Text, TextArea } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { complaintStatusLabel, complaintTargetLabel } from '../../shared/labels';
import { extractApiErrorMessage } from '../../shared/apiError';

type Complaint = {
  id: string;
  targetType: 'AD' | 'USER';
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  reason: string;
  description?: string | null;
  createdAt: string;
  reviewComment?: string | null;
  reporter: { id: string; name?: string | null; email: string };
  ad?: { id: string; petName?: string | null; status: string } | null;
  targetUser?: { id: string; name?: string | null; email: string } | null;
};

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | Complaint['status']>('PENDING');
  const [reviewComment, setReviewComment] = useState<Record<string, string>>({});

  async function fetchComplaints() {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter === 'ALL' ? undefined : { status: statusFilter };
      const response = await api.get('/admin/complaints', { params });
      setComplaints(response.data);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось загрузить жалобы'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchComplaints();
  }, [statusFilter]);

  const pendingCount = useMemo(
    () => complaints.filter((complaint) => complaint.status === 'PENDING').length,
    [complaints],
  );

  async function reviewComplaint(id: string, status: 'RESOLVED' | 'REJECTED') {
    try {
      await api.post(`/admin/complaints/${id}/review`, {
        status,
        reviewComment: reviewComment[id] || undefined,
      });
      setComplaints((prev) => prev.map((complaint) => (complaint.id === id ? { ...complaint, status, reviewComment: reviewComment[id] || null } : complaint)));
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось обработать жалобу'));
    }
  }

  return (
    <Container size="3">
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center" wrap="wrap" gap="2">
          <Heading size="8">Жалобы</Heading>
          <Flex gap="2" align="center">
            <Badge color="orange">Новых: {pendingCount}</Badge>
            <Select.Root value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'ALL' | Complaint['status'])}>
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="ALL">Все</Select.Item>
                <Select.Item value="PENDING">Новые</Select.Item>
                <Select.Item value="RESOLVED">Решенные</Select.Item>
                <Select.Item value="REJECTED">Отклоненные</Select.Item>
              </Select.Content>
            </Select.Root>
          </Flex>
        </Flex>

        {loading && <Text>Загрузка...</Text>}
        {error && <Text color="red">{error}</Text>}
        {!loading && complaints.length === 0 && <Text color="gray">Жалоб пока нет.</Text>}

        <Flex direction="column" gap="3">
          {complaints.map((complaint) => (
            <Card key={complaint.id}>
              <Flex direction="column" gap="2">
                <Flex justify="between" align="center" wrap="wrap" gap="2">
                  <Text weight="bold">{complaintTargetLabel(complaint.targetType)}</Text>
                  <Badge color={complaint.status === 'PENDING' ? 'orange' : complaint.status === 'RESOLVED' ? 'green' : 'gray'}>
                    {complaintStatusLabel(complaint.status)}
                  </Badge>
                </Flex>

                <Text size="2" color="gray">
                  От: {complaint.reporter.name || complaint.reporter.email}
                </Text>
                {complaint.ad && <Text size="2" color="gray">Объявление: {complaint.ad.petName || complaint.ad.id}</Text>}
                {complaint.targetUser && (
                  <Text size="2" color="gray">
                    Пользователь: {complaint.targetUser.name || complaint.targetUser.email}
                  </Text>
                )}

                <Text><b>Причина:</b> {complaint.reason}</Text>
                {complaint.description && <Text size="2">{complaint.description}</Text>}

                <Text size="1" color="gray">
                  {new Date(complaint.createdAt).toLocaleString()}
                </Text>

                {complaint.status === 'PENDING' ? (
                  <Flex direction="column" gap="2">
                    <TextArea
                      placeholder="Комментарий модератора (необязательно)"
                      value={reviewComment[complaint.id] || ''}
                      onChange={(event) => setReviewComment((prev) => ({ ...prev, [complaint.id]: event.target.value }))}
                    />
                    <Flex gap="2">
                      <Button onClick={() => void reviewComplaint(complaint.id, 'RESOLVED')}>Принять</Button>
                      <Button color="red" variant="soft" onClick={() => void reviewComplaint(complaint.id, 'REJECTED')}>
                        Отклонить
                      </Button>
                    </Flex>
                  </Flex>
                ) : (
                  complaint.reviewComment && (
                    <Text size="2" color="gray">Комментарий: {complaint.reviewComment}</Text>
                  )
                )}
              </Flex>
            </Card>
          ))}
        </Flex>
      </Flex>
    </Container>
  );
}
