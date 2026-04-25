import { useEffect, useMemo, useState } from 'react';
import { Button, Container, Dialog, Flex, Heading, Select, Text, TextArea, Section } from '@radix-ui/themes';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/axios';
import ConfirmActionDialog from '../../components/common/ConfirmActionDialog';
import AdCard from '../../components/ads/AdCard';
import { extractApiErrorMessage } from '../../shared/apiError';
import { usePageTitle } from '../../shared/usePageTitle';
import { PackageIcon, PencilIcon, DeleteIcon } from '../../components/common/Icons';

type Ad = {
  id: string;
  petName?: string | null;
  animalType?: string | null;
  breed?: string | null;
  color?: string | null;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  type: 'LOST' | 'FOUND';
  photos?: Array<{ photoUrl: string }>;
  createdAt?: string | null;
  user?: { id: string; name?: string | null; email?: string; avatarUrl?: string | null };
};

export default function AdminAdsPage() {
  usePageTitle('Админ — Объявления');
  const navigate = useNavigate();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | Ad['status']>('ALL');
  const [rejectTarget, setRejectTarget] = useState<Ad | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  async function fetchAds() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/ads', { params: { take: 300 } });
      setAds(response.data);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось загрузить объявления'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchAds();
  }, []);

  const filteredAds = useMemo(
    () => (statusFilter === 'ALL' ? ads : ads.filter((ad) => ad.status === statusFilter)),
    [ads, statusFilter],
  );

  const totalPages = Math.ceil(filteredAds.length / itemsPerPage);
  const paginatedAds = useMemo(
    () => filteredAds.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filteredAds, currentPage, itemsPerPage],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  async function moderate(id: string, status: 'APPROVED' | 'ARCHIVED') {
    try {
      const response = await api.post(`/ads/${id}/moderate`, { status });
      const updated = response.data as Ad;
      setAds((prev) => prev.map((ad) => (ad.id === id ? { ...ad, status: updated.status } : ad)));
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось обновить статус'));
    }
  }

  async function restoreFromArchive(id: string) {
    try {
      const response = await api.patch(`/ads/${id}`, { status: 'APPROVED' });
      const updated = response.data as Ad;
      setAds((prev) => prev.map((ad) => (ad.id === id ? { ...ad, status: updated.status } : ad)));
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось восстановить объявление'));
    }
  }

  async function rejectAd() {
    if (!rejectTarget) return;
    if (rejectReason.trim().length < 5) {
      setError('Укажите причину отклонения (минимум 5 символов)');
      return;
    }

    setRejectLoading(true);
    setError(null);
    try {
      const response = await api.post(`/ads/${rejectTarget.id}/moderate`, {
        status: 'REJECTED',
        reason: rejectReason.trim(),
      });

      const updated = response.data as Ad;
      setAds((prev) => prev.map((ad) => (ad.id === rejectTarget.id ? { ...ad, status: updated.status } : ad)));

      setRejectReason('');
      setRejectTarget(null);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось отклонить объявление'));
    } finally {
      setRejectLoading(false);
    }
  }

  async function deleteAd(id: string) {
    try {
      await api.delete(`/ads/${id}`);
      setAds((prev) => prev.filter((ad) => ad.id !== id));
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось удалить объявление'));
    }
  }

  function handleEdit(ad: Ad) {
    navigate(`/my-ads/${ad.id}/edit?from=admin`);
  }

  return (
    <>
      <Section size="2" style={{
        background: 'linear-gradient(135deg, var(--green-2) 0%, var(--accent-soft) 100%)',
        borderBottom: '1px solid var(--gray-a5)',
      }}>
        <Container size="3">
          <Flex justify="between" align="center" wrap="wrap" gap="3">
            <Heading size="8" weight="bold">
              <Flex align="center" gap="3">
                <PackageIcon width={32} height={32} color="var(--green-11)" />
                Объявления
              </Flex>
            </Heading>
            <Flex align="center" gap="2">
              <Select.Root value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'ALL' | Ad['status'])}>
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="ALL">Все статусы</Select.Item>
                  <Select.Item value="PENDING">На модерации</Select.Item>
                  <Select.Item value="APPROVED">Активные</Select.Item>
                  <Select.Item value="ARCHIVED">Найдены / В архиве</Select.Item>
                  <Select.Item value="REJECTED">Отклонено</Select.Item>
                </Select.Content>
              </Select.Root>
              <Button variant="soft" onClick={() => void fetchAds()}>Обновить</Button>
            </Flex>
          </Flex>
        </Container>
      </Section>

      <Container size="3" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-8)' }}>
        <Flex direction="column" gap="4">
          {loading && <Text>Загрузка...</Text>}
          {error && <Text color="red">{error}</Text>}
          {!loading && filteredAds.length === 0 && <Text color="gray">Ничего не найдено.</Text>}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 'var(--space-4)',
          }}>
            {paginatedAds.map((ad) => (
              <div key={ad.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <AdCard
                  ad={ad}
                  to={`/ads/${ad.id}`}
                  showDescription={true}
                  imageHeight={200}
                  hideBadges={false}
                />

                {/* Admin Actions */}
                <Flex direction="column" gap="2">
                  {ad.status === 'PENDING' && (
                    <Flex gap="2">
                      <ConfirmActionDialog
                        title="Одобрить объявление?"
                        description="После одобрения объявление появится в общем списке."
                        confirmText="Одобрить"
                        color="violet"
                        onConfirm={() => moderate(ad.id, 'APPROVED')}
                        trigger={<Button size="3" style={{ flex: 1, minHeight: 40 }}>Одобрить</Button>}
                      />
                      <Button variant="soft" color="red" size="3" onClick={() => setRejectTarget(ad)} style={{ flex: 1, minHeight: 40 }}>
                        Отклонить
                      </Button>
                    </Flex>
                  )}

                  {ad.status === 'APPROVED' && (
                    <ConfirmActionDialog
                      title="Отправить объявление в архив?"
                      description="Пользователи больше не увидят его в активных объявлениях."
                      confirmText="В архив"
                      color="orange"
                      onConfirm={() => moderate(ad.id, 'ARCHIVED')}
                      trigger={<Button variant="soft" color="gray" size="3" style={{ width: '100%', minHeight: 40 }}>В архив</Button>}
                    />
                  )}

                  {ad.status === 'ARCHIVED' && (
                    <ConfirmActionDialog
                      title="Вернуть объявление из архива?"
                      description="Объявление снова станет активным."
                      confirmText="Восстановить"
                      color="violet"
                      onConfirm={() => restoreFromArchive(ad.id)}
                      trigger={<Button variant="outline" size="3" style={{ width: '100%', minHeight: 40 }}>Достать из архива</Button>}
                    />
                  )}

                  {ad.status === 'REJECTED' && (
                    <Flex gap="2">
                      <ConfirmActionDialog
                        title="Одобрить объявление?"
                        description="Объявление будет одобрено и появится в общем списке."
                        confirmText="Одобрить"
                        color="violet"
                        onConfirm={() => moderate(ad.id, 'APPROVED')}
                        trigger={<Button size="3" style={{ flex: 1, minHeight: 40 }}>Одобрить</Button>}
                      />
                      <ConfirmActionDialog
                        title="Удалить объявление?"
                        description="Это действие нельзя отменить. Объявление будет удалено навсегда."
                        confirmText="Удалить"
                        color="red"
                        onConfirm={() => deleteAd(ad.id)}
                        trigger={<Button variant="soft" color="red" size="3" style={{ flex: 1, minHeight: 40 }}>Удалить</Button>}
                      />
                    </Flex>
                  )}

                  <Flex gap="2">
                    <Button
                      variant="soft"
                      size="3"
                      onClick={() => handleEdit(ad)}
                      style={{ flex: 1, minHeight: 40 }}
                    >
                      <PencilIcon width={16} height={16} />
                      Редактировать
                    </Button>

                    <ConfirmActionDialog
                      title="Удалить объявление?"
                      description="Это действие нельзя отменить. Объявление будет удалено навсегда."
                      confirmText="Удалить"
                      color="red"
                      onConfirm={() => deleteAd(ad.id)}
                      trigger={
                        <Button variant="soft" color="red" size="3" style={{ flex: 1, minHeight: 40 }}>
                          <DeleteIcon width={16} height={16} />
                          Удалить
                        </Button>
                      }
                    />
                  </Flex>
                </Flex>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Flex justify="center" gap="2" style={{ marginTop: 'var(--space-6)' }}>
              <Button
                variant="soft"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                ← Назад
              </Button>
              
              <Flex gap="2" align="center">
                {(() => {
                  const pages = [];
                  const maxVisiblePages = 7; // Максимум видимых кнопок страниц
                  
                  if (totalPages <= maxVisiblePages) {
                    // Если страниц мало, показываем все
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(
                        <Button
                          key={i}
                          variant={i === currentPage ? 'solid' : 'soft'}
                          onClick={() => setCurrentPage(i)}
                          style={{ minWidth: 40 }}
                        >
                          {i}
                        </Button>
                      );
                    }
                  } else {
                    // Умная пагинация для большого количества страниц
                    const startPage = Math.max(1, currentPage - 2);
                    const endPage = Math.min(totalPages, currentPage + 2);
                    
                    // Первая страница
                    if (startPage > 1) {
                      pages.push(
                        <Button
                          key={1}
                          variant={1 === currentPage ? 'solid' : 'soft'}
                          onClick={() => setCurrentPage(1)}
                          style={{ minWidth: 40 }}
                        >
                          1
                        </Button>
                      );
                      
                      if (startPage > 2) {
                        pages.push(
                          <Text key="ellipsis1" size="2" color="gray" style={{ padding: '0 8px' }}>
                            ...
                          </Text>
                        );
                      }
                    }
                    
                    // Страницы вокруг текущей
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <Button
                          key={i}
                          variant={i === currentPage ? 'solid' : 'soft'}
                          onClick={() => setCurrentPage(i)}
                          style={{ minWidth: 40 }}
                        >
                          {i}
                        </Button>
                      );
                    }
                    
                    // Последняя страница
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <Text key="ellipsis2" size="2" color="gray" style={{ padding: '0 8px' }}>
                            ...
                          </Text>
                        );
                      }
                      
                      pages.push(
                        <Button
                          key={totalPages}
                          variant={totalPages === currentPage ? 'solid' : 'soft'}
                          onClick={() => setCurrentPage(totalPages)}
                          style={{ minWidth: 40 }}
                        >
                          {totalPages}
                        </Button>
                      );
                    }
                  }
                  
                  return pages;
                })()}
              </Flex>
              
              <Button
                variant="soft"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Вперёд →
              </Button>
            </Flex>
          )}
        </Flex>
      </Container>

      {/* Reject Dialog */}
      <Dialog.Root open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <Dialog.Content maxWidth="560px">
          <Dialog.Title>Отклонить объявление</Dialog.Title>
          <Dialog.Description size="2" mb="3">
            Укажите причину отклонения. Автор получит уведомление с указанной причиной.
          </Dialog.Description>
          <Flex direction="column" gap="3">
            <TextArea
              placeholder="Причина отклонения"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
            />
            <Flex justify="end" gap="2">
              <Dialog.Close>
                <Button variant="soft" type="button">Отмена</Button>
              </Dialog.Close>
              <Button color="red" type="button" disabled={rejectLoading} onClick={() => void rejectAd()}>
                {rejectLoading ? 'Сохранение...' : 'Отклонить'}
              </Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
