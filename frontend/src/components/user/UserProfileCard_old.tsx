import { useState } from 'react';
import { Badge, Button, Card, Dialog, Flex, Heading, Text, TextArea, TextField } from '@radix-ui/themes';
import { api } from '../../api/axios';
import ConfirmActionDialog from '../common/ConfirmActionDialog';
import { extractApiErrorMessage } from '../../shared/apiError';

export type UserProfileType = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  telegramUsername?: string | null;
  role?: 'USER' | 'ADMIN';
  isBlocked?: boolean;
  createdAt?: string;
};

type UserProfileCardProps = {
  user: UserProfileType;
  isAdmin?: boolean;
  onBlockToggle?: (userId: string, block: boolean) => Promise<void>;
  onRoleChange?: (userId: string, role: 'USER' | 'ADMIN') => Promise<void>;
  onStartChat?: (userId: string) => Promise<void>;
  showContactInfo?: boolean;
  clickable?: boolean;
  onUserClick?: (userId: string) => void;
};

export default function UserProfileCard({
  user,
  isAdmin = false,
  onBlockToggle,
  onRoleChange,
  onStartChat,
  showContactInfo = true,
  clickable = false,
  onUserClick,
}: UserProfileCardProps) {
  const [error, setError] = useState<string | null>(null);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintReason, setComplaintReason] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);

  async function submitComplaint() {
    if (complaintReason.trim().length < 5) {
      setError('Причина жалобы должна быть не менее 5 символов');
      return;
    }

    setComplaintSubmitting(true);
    setError(null);
    try {
      await api.post('/complaints', {
        targetType: 'USER',
        targetId: user.id,
        reason: complaintReason.trim(),
        description: complaintDescription.trim() || undefined,
      });
      setComplaintOpen(false);
      setComplaintReason('');
      setComplaintDescription('');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось отправить жалобу'));
    } finally {
      setComplaintSubmitting(false);
    }
  }

  function handleAvatarClick(e: React.MouseEvent) {
    e.preventDefault();
    if (clickable && onUserClick) onUserClick(user.id);
  }

  return (
    <>
      <Card
        onClick={clickable ? handleAvatarClick : undefined}
        style={{
          cursor: clickable ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          ...(clickable && {
            ':hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            },
          }),
        }}
        onMouseEnter={(e) => {
          if (clickable) {
            const el = e.currentTarget as HTMLElement;
            el.style.transform = 'translateY(-2px)';
            el.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (clickable) {
            const el = e.currentTarget as HTMLElement;
            el.style.transform = 'translateY(0)';
            el.style.boxShadow = '';
          }
        }}
      >
        <Flex direction="column" gap="3">
          {/* Header */}
          <Flex justify="between" align="start" gap="2" wrap="wrap">
            <Flex direction="column" gap="2">
              <Heading size="4">{user.name || user.email}</Heading>
              <Flex gap="2" wrap="wrap">
                {user.role === 'ADMIN' && (
                  <Badge color="violet" size="2">
                    Администратор
                  </Badge>
                )}
                {user.isBlocked && (
                  <Badge color="red" size="2">
                    Заблокирован
                  </Badge>
                )}
              </Flex>
            </Flex>
            {user.createdAt && (
              <Text size="1" color="gray">
                На платформе с {new Date(user.createdAt).toLocaleDateString()}
              </Text>
            )}
          </Flex>

          {/* Contact Info */}
          {showContactInfo && (
            <Flex direction="column" gap="2" style={{
              backgroundColor: 'var(--gray-a2)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-2)',
            }}>
              <Text size="1" weight="bold" color="gray">Контакты:</Text>
              {user.email && (
                <Flex gap="2" align="center">
                  <Text size="2">📧</Text>
                  <a href={`mailto:${user.email}`} style={{ color: 'var(--blue-11)', textDecoration: 'none' }}>
                    <Text size="2">{user.email}</Text>
                  </a>
                </Flex>
              )}
              {user.phone && (
                <Flex gap="2" align="center">
                  <Text size="2">📱</Text>
                  <a href={`tel:${user.phone}`} style={{ color: 'var(--blue-11)', textDecoration: 'none' }}>
                    <Text size="2">{user.phone}</Text>
                  </a>
                </Flex>
              )}
              {user.telegramUsername && (
                <Flex gap="2" align="center">
                  <Text size="2">💬</Text>
                  <a 
                    href={`https://t.me/${user.telegramUsername}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: 'var(--blue-11)', textDecoration: 'none' }}
                  >
                    <Text size="2">@{user.telegramUsername}</Text>
                  </a>
                </Flex>
              )}
              {!user.email && !user.phone && !user.telegramUsername && (
                <Text size="1" color="gray">Контакты не указаны</Text>
              )}
            </Flex>
          )}

          {/* Actions */}
          <Flex gap="2" wrap="wrap">
            <Button 
              variant="soft" 
              size="2"
              asChild
            >
              <a href={`/users/${user.id}`}>Профиль</a>
            </Button>

            {onStartChat && (
              <Button size="2" onClick={() => onStartChat(user.id)}>
                Написать
              </Button>
            )}

            {isAdmin && onBlockToggle && (
              <ConfirmActionDialog
                title={user.isBlocked ? 'Разблокировать?' : 'Заблокировать?'}
                description={user.isBlocked ? 'Пользователь получит доступ.' : 'Пользователь потеряет доступ.'}
                confirmText={user.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                color={user.isBlocked ? 'violet' : 'red'}
                onConfirm={() => onBlockToggle(user.id, !user.isBlocked)}
                trigger={
                  <Button 
                    variant="outline" 
                    color={user.isBlocked ? 'violet' : 'red'}
                    size="2"
                  >
                    {user.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                  </Button>
                }
              />
            )}

            {isAdmin && onRoleChange && user.role && (
              <ConfirmActionDialog
                title={user.role === 'ADMIN' ? 'Снять роль админа?' : 'Назначить админом?'}
                description={user.role === 'ADMIN' ? 'Пользователь будет обычным.' : 'Пользователь получит права админа.'}
                confirmText={user.role === 'ADMIN' ? 'Снять' : 'Назначить'}
                color="orange"
                onConfirm={() => onRoleChange(user.id, user.role === 'ADMIN' ? 'USER' : 'ADMIN')}
                trigger={
                  <Button 
                    variant="outline" 
                    color={user.role === 'ADMIN' ? 'orange' : 'violet'}
                    size="2"
                  >
                    {user.role === 'ADMIN' ? 'Снять админ' : 'Сделать админ'}
                  </Button>
                }
              />
            )}

            <Button 
              variant="soft" 
              color="orange"
              size="2"
              onClick={() => setComplaintOpen(true)}
            >
              Пожаловаться
            </Button>
          </Flex>
        </Flex>
      </Card>

      {/* Complaint Dialog */}
      <Dialog.Root open={complaintOpen} onOpenChange={setComplaintOpen}>
        <Dialog.Content maxWidth="500px">
          <Dialog.Title>Пожаловаться на пользователя</Dialog.Title>
          {error && <Text color="red" size="2">{error}</Text>}
          <Flex direction="column" gap="3">
            <Flex direction="column" gap="2">
              <Text size="2" weight="bold">Причина жалобы *</Text>
              <TextField.Root
                value={complaintReason}
                onChange={(e) => setComplaintReason(e.target.value)}
                placeholder="Минимум 5 символов"
              />
            </Flex>
            <Flex direction="column" gap="2">
              <Text size="2">Подробное описание</Text>
              <TextArea
                value={complaintDescription}
                onChange={(e) => setComplaintDescription(e.target.value)}
                placeholder="Дополнительная информация (опционально)"
                style={{ minHeight: '120px' }}
              />
            </Flex>
            <Flex justify="end" gap="2">
              <Dialog.Close>
                <Button variant="soft" type="button">Отмена</Button>
              </Dialog.Close>
              <Button 
                type="button" 
                onClick={() => submitComplaint()}
                disabled={complaintSubmitting}
              >
                {complaintSubmitting ? 'Отправка...' : 'Отправить'}
              </Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
