import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Container, Flex, Heading, Select, Text, TextArea } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { api } from '../../api/axios';
import ConfirmActionDialog from '../../components/common/ConfirmActionDialog';
import UserAvatarLink from '../../components/user/UserAvatarLink';
import { extractApiErrorMessage } from '../../shared/apiError';
import { complaintStatusLabel, complaintTargetLabel } from '../../shared/labels';

type Complaint = {
  id: string;
  kind: 'REPORT' | 'SUPPORT';
  targetType: 'AD' | 'USER' | 'NONE';
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  reason: string;
  description?: string | null;
  createdAt: string;
  reviewComment?: string | null;
  reporter: { id: string; name?: string | null; email: string; avatarUrl?: string | null };
  ad?: { id: string; petName?: string | null; status: string } | null;
  targetUser?: { id: string; name?: string | null; email: string; avatarUrl?: string | null } | null;
};

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | Complaint['status']>('PENDING');
  const [kindFilter, setKindFilter] = useState<'ALL' | Complaint['kind']>('ALL');
  const [reviewComment, setReviewComment] = useState<Record<string, string>>({});

  async function fetchComplaints() {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (kindFilter !== 'ALL') params.kind = kindFilter;
      const response = await api.get('/admin/complaints', { params });
      setComplaints(response.data);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось загрузить обращения'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchComplaints();
  }, [statusFilter, kindFilter]);

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
      setComplaints((prev) =>
        prev.map((complaint) =>
          complaint.id === id ? { ...complaint, status, reviewComment: reviewComment[id] || null } : complaint,
        ),
      );
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось обработать обращение'));
    }
  }

  return (
    <Container size="3">
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center" wrap="wrap" gap="2">
          <Heading size="8">Жалобы и обращения</Heading>
          <Flex gap="2" align="center" wrap="wrap">
            <Badge color="orange">Новых: {pendingCount}</Badge>
            <Select.Root value={kindFilter} onValueChange={(value) => setKindFilter(value as 'ALL' | Complaint['kind'])}>
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="ALL">Все типы</Select.Item>
                <Select.Item value="REPORT">Жалобы</Select.Item>
                <Select.Item value="SUPPORT">Поддержка</Select.Item>
              </Select.Content>
            </Select.Root>
            <Select.Root value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'ALL' | Complaint['status'])}>
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="ALL">Все статусы</Select.Item>
                <Select.Item value="PENDING">Новые</Select.Item>
                <Select.Item value="RESOLVED">Решенные</Select.Item>
                <Select.Item value="REJECTED">Отклоненные</Select.Item>
              </Select.Content>
            </Select.Root>
          </Flex>
        </Flex>

        {loading && <Text>Загрузка...</Text>}
        {error && <Text color="red">{error}</Text>}
        {!loading && complaints.length === 0 && <Text color="gray">Обращений пока нет.</Text>}

        <Flex direction="column" gap="3">
          {complaints.map((complaint) => (
            <Card key={complaint.id}>
              <Flex direction="column" gap="2">
                <Flex justify="between" align="center" wrap="wrap" gap="2">
                  <Flex align="center" gap="2">
                    <Badge variant="soft" color={complaint.kind === 'SUPPORT' ? 'violet' : 'orange'}>
                      {complaint.kind === 'SUPPORT' ? 'Поддержка' : 'Жалоба'}
                    </Badge>
                    <Text weight="bold">{complaint.kind === 'SUPPORT' ? 'Обращение в поддержку' : complaintTargetLabel(complaint.targetType)}</Text>
                  </Flex>
                  <Badge color={complaint.status === 'PENDING' ? 'orange' : complaint.status === 'RESOLVED' ? 'green' : 'gray'}>
                    {complaintStatusLabel(complaint.status)}
                  </Badge>
                </Flex>

                <UserAvatarLink
                  userId={complaint.reporter.id}
                  name={complaint.reporter.name}
                  email={complaint.reporter.email}
                  avatarUrl={complaint.reporter.avatarUrl}
                  subtitle="Автор обращения"
                />

                {complaint.ad && (
                  <Text size="2" color="gray">
                    Объявление: <Link to={`/ads/${complaint.ad.id}`}>{complaint.ad.petName || complaint.ad.id}</Link>
                  </Text>
                )}
                {complaint.targetUser && (
                  <UserAvatarLink
                    userId={complaint.targetUser.id}
                    name={complaint.targetUser.name}
                    email={complaint.targetUser.email}
                    avatarUrl={complaint.targetUser.avatarUrl}
                    subtitle="Пользователь, на которого подана жалоба"
                  />
                )}

                <Text><b>Тема:</b> {complaint.reason}</Text>
                {complaint.description && <Text size="2">{complaint.description}</Text>}
                <Text size="1" color="gray">{new Date(complaint.createdAt).toLocaleString()}</Text>

                {complaint.status === 'PENDING' ? (
                  <Flex direction="column" gap="2">
                    <TextArea
                      placeholder="Комментарий администратора"
                      value={reviewComment[complaint.id] || ''}
                      onChange={(event) =>
                        setReviewComment((prev) => ({ ...prev, [complaint.id]: event.target.value }))
                      }
                    />
                    <Flex gap="2" wrap="wrap">
                      <ConfirmActionDialog
                        title="Подтвердить решение обращения?"
                        description="Пользователь получит уведомление с вашим комментарием."
                        confirmText="Решить"
                        color="violet"
                        onConfirm={() => reviewComplaint(complaint.id, 'RESOLVED')}
                        trigger={<Button>Решить</Button>}
                      />
                      <ConfirmActionDialog
                        title="Отклонить обращение?"
                        description="Пользователь получит уведомление с причиной отклонения."
                        confirmText="Отклонить"
                        color="red"
                        onConfirm={() => reviewComplaint(complaint.id, 'REJECTED')}
                        trigger={<Button color="red" variant="soft">Отклонить</Button>}
                      />
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
