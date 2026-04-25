import { useState } from 'react';
import { Avatar, Badge, Button, Dialog, Flex, Heading, Text } from '@radix-ui/themes';
import { AlertTriangleIcon } from '../common/Icons';
import { api } from '../../api/axios';
import ConfirmActionDialog from '../common/ConfirmActionDialog';
import { extractApiErrorMessage } from '../../shared/apiError';
import { config } from '../../shared/config';

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

const TelegramIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.33-.373-.117l-6.869 4.332-2.963-.924c-.643-.204-.658-.643.136-.953l11.566-4.458c.538-.196 1.006.128.832.941z"/>
  </svg>
);

const PhoneIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const EmailIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const MessageIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

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

  function resolveAvatarSrc(avatarUrl?: string | null) {
    if (!avatarUrl) return undefined;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    if (!config.apiUrl) return avatarUrl;
    return `${config.apiUrl}${avatarUrl}`;
  }

  const avatarSrc = resolveAvatarSrc(user.avatarUrl);
  const initials = (user.name || user.email || 'U').slice(0, 1).toUpperCase();

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

  function handleCardClick() {
    if (clickable && onUserClick) onUserClick(user.id);
  }

  return (
    <>
      <div
        onClick={handleCardClick}
        style={{
          cursor: clickable ? 'pointer' : 'default',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--gray-a6)',
          background: 'linear-gradient(135deg, var(--surface) 0%, var(--gray-a1) 100%)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={(e) => {
          if (clickable) {
            const el = e.currentTarget as HTMLElement;
            el.style.transform = 'translateY(-4px)';
            el.style.boxShadow = '0 12px 24px rgba(124, 58, 237, 0.12)';
            el.style.borderColor = 'var(--violet-8)';
          }
        }}
        onMouseLeave={(e) => {
          if (clickable) {
            const el = e.currentTarget as HTMLElement;
            el.style.transform = 'translateY(0)';
            el.style.boxShadow = '';
            el.style.borderColor = 'var(--gray-a6)';
          }
        }}
      >
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
            <Avatar 
              src={avatarSrc} 
              fallback={initials} 
              radius="full" 
              size="5"
              style={{ flexShrink: 0 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: 0 }}>
              <Heading size="5" style={{ margin: 0 }}>
                {user.name || user.email || 'Пользователь'}
              </Heading>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {user.role === 'ADMIN' && (
                  <Badge color="violet" style={{ fontWeight: '600', fontSize: '11px' }}>
                    👤 Администратор
                  </Badge>
                )}
                {user.isBlocked && (
                  <Badge color="red" style={{ fontWeight: '600', fontSize: '11px' }}>
                    🚫 Заблокирован
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {user.createdAt && (
            <Text size="1" color="gray" style={{ whiteSpace: 'nowrap' }}>
              На сайте с {new Date(user.createdAt).toLocaleDateString('ru-RU')}
            </Text>
          )}
        </div>

        {/* Contact Info Section */}
        {showContactInfo && (user.email || user.phone || user.telegramUsername) && (
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-soft) 0%, var(--accent-soft) 100%)',
            padding: '14px 16px',
            borderRadius: '10px',
            border: '1px solid var(--gray-a5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '16px',
          }}>
            {user.email && (
              <a 
                href={`mailto:${user.email}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--accent-11)' }}>
                  <EmailIcon size={18} />
                  <Text size="2" style={{ color: 'inherit' }}>{user.email}</Text>
                </div>
              </a>
            )}
            {user.phone && (
              <a 
                href={`tel:${user.phone}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--accent-11)' }}>
                  <PhoneIcon size={18} />
                  <Text size="2" style={{ color: 'inherit' }}>{user.phone}</Text>
                </div>
              </a>
            )}
            {user.telegramUsername && (
              <a 
                href={`https://t.me/${user.telegramUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--accent-11)' }}>
                  <TelegramIcon size={18} />
                  <Text size="2" style={{ color: 'inherit' }}>@{user.telegramUsername}</Text>
                </div>
              </a>
            )}
          </div>
        )}

        {/* Actions Section */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          
          {onStartChat && (
            <Button
              size="2"
              onClick={(e) => {
                e.stopPropagation();
                onStartChat(user.id);
              }}
              style={{
                background: 'var(--chat-user-bg)',
                cursor: 'pointer',
              }}
            >
              <MessageIcon size={16} />
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
              title={user.role === 'ADMIN' ? 'Снять роль?' : 'Назначить?'}
              description={user.role === 'ADMIN' ? 'Станет обычным пользователем.' : 'Получит права админа.'}
              confirmText={user.role === 'ADMIN' ? 'Снять' : 'Назначить'}
              color="orange"
              onConfirm={() => onRoleChange(user.id, user.role === 'ADMIN' ? 'USER' : 'ADMIN')}
              trigger={
                <Button 
                  variant="outline"
                  color={user.role === 'ADMIN' ? 'orange' : 'violet'}
                  size="2"
                >
                  {user.role === 'ADMIN' ? 'Снять админа' : 'Сделать админом'}
                </Button>
              }
            />
          )}

          <Button 
            variant="soft" 
            color="orange"
            size="2"
            onClick={(e) => {
              e.stopPropagation();
              setComplaintOpen(true);
            }}
          >
            <Flex align="center" gap="2"><AlertTriangleIcon width={16} height={16} />Пожаловаться</Flex>
          </Button>
        </div>
      </div>

      {/* Complaint Dialog */}
      <Dialog.Root open={complaintOpen} onOpenChange={setComplaintOpen}>
        <Dialog.Content maxWidth="500px">
          <Dialog.Title>Пожаловаться на пользователя</Dialog.Title>
          {error && <Text color="red" size="2">{error}</Text>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Text size="2" weight="bold">Причина жалобы *</Text>
              <input
                type="text"
                value={complaintReason}
                onChange={(e) => setComplaintReason(e.target.value)}
                placeholder="Минимум 5 символов"
                style={{
                  padding: '10px 12px',
                  border: '1px solid var(--gray-a6)',
                  borderRadius: '6px',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Text size="2">Подробное описание</Text>
              <textarea
                value={complaintDescription}
                onChange={(e) => setComplaintDescription(e.target.value)}
                placeholder="Дополнительная информация (опционально)"
                style={{
                  minHeight: '120px',
                  padding: '10px 12px',
                  border: '1px solid var(--gray-a6)',
                  borderRadius: '6px',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
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
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
