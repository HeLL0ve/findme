import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, Container, Dialog, Flex, Heading, Text, TextArea, TextField } from '@radix-ui/themes';
import { MessageIcon, AlertTriangleIcon, PawIcon, DescriptionIcon, LocationIcon, UserIcon, PrintIcon, ShareIcon, PhoneIcon, MailIcon, HeartFilledIcon, HeartIcon } from '../../components/common/Icons';
import { api } from '../../api/axios';
import ConfirmActionDialog from '../../components/common/ConfirmActionDialog';
import UserAvatarLink from '../../components/user/UserAvatarLink';
import { extractApiErrorMessage } from '../../shared/apiError';
import { useAuthStore } from '../../shared/authStore';
import { config } from '../../shared/config';
import { adStatusLabel } from '../../shared/labels';
import { AdLocationMap } from '../../shared/AdLocationMap';
import { usePageTitle } from '../../shared/usePageTitle';
import { useFavoritesStore } from '../../shared/favoritesStore';

type Ad = {
  id: string;
  petName?: string | null;
  animalType?: string | null;
  breed?: string | null;
  color?: string | null;
  description: string;
  status: string;
  type: 'LOST' | 'FOUND';
  userId: string;
  user?: {
    id: string;
    name?: string | null;
    email?: string;
    phone?: string | null;
    telegramUsername?: string | null;
    avatarUrl?: string | null;
  };
  location?: {
    address?: string | null;
    city?: string | null;
    latitude?: number;
    longitude?: number;
  } | null;
  photos?: Array<{ photoUrl: string }>;
};

type ComplaintTarget = {
  type: 'AD';
  targetId: string;
  title: string;
} | null;

function resolvePhotoSrc(photoUrl: string) {
  if (photoUrl.startsWith('http')) return photoUrl;
  return `${config.apiUrl || ''}${photoUrl}`;
}

export default function AdDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isFavorite = useFavoritesStore((s) => id ? s.isFavorite(id) : false);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);

  const [ad, setAd] = useState<Ad | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [complaintTarget, setComplaintTarget] = useState<ComplaintTarget>(null);
  const [complaintReason, setComplaintReason] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  usePageTitle(ad ? (ad.petName || (ad.type === 'LOST' ? 'Потерян питомец' : 'Найден питомец')) : 'Объявление');

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        const response = await api.get(`/ads/${id}`);
        if (!mounted) return;
        setAd(response.data);
        setSelectedPhotoIndex(0);
      } catch (err) {
        if (!mounted) return;
        setError(extractApiErrorMessage(err, 'Ошибка загрузки объявления'));
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const photos = useMemo(
    () => (ad?.photos || []).map((photo) => resolvePhotoSrc(photo.photoUrl)),
    [ad?.photos],
  );

  const selectedPhoto = photos[selectedPhotoIndex] || null;

  async function startChat() {
    if (!id) return;
    try {
      const response = await api.post('/chats', { adId: id });
      navigate(`/chats/${response.data.id}`);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось создать чат'));
    }
  }

  async function shareAd() {
    if (!ad || !id) return;
    const title = ad.petName || 'Объявление на FindMe';
    const adUrl = `${window.location.origin}/ads/${id}`;
    const text = `${ad.type === 'LOST' ? 'Потерян' : 'Найден'} ${ad.animalType || 'питомец'}: ${ad.description}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: adUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share error:', err);
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${title}\n${text}\n${adUrl}`);
        alert('Ссылка скопирована в буфер обмена');
      } catch {
        alert(`Скопируйте вручную: ${adUrl}`);
      }
    }
  }

  async function exportToPdf() {
    if (!ad || !id) return;

    const title = ad.petName || 'Питомец';
    const adUrl = `${window.location.origin}/ads/${id}`;
    const timestamp = new Date().toLocaleString('ru-RU');

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 20px; }
            .header { border-bottom: 2px solid #7c3aed; padding-bottom: 10px; margin-bottom: 20px; }
            .title { font-size: 28px; font-weight: bold; color: #7c3aed; margin: 10px 0; }
            .badge { display: inline-block; padding: 4px 12px; margin-right: 8px; border-radius: 6px; font-size: 12px; font-weight: bold; }
            .badge-lost { background: #fed7aa; color: #92400e; }
            .badge-found { background: #bbf7d0; color: #065f46; }
            .badge-approved { background: #bfdbfe; color: #1e3a8a; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 14px; font-weight: bold; color: #7c3aed; margin-bottom: 8px; }
            .info-row { display: flex; margin-bottom: 8px; }
            .info-label { font-weight: bold; width: 120px; }
            .info-value { flex: 1; }
            .description { background: #f3f4f6; padding: 12px; border-radius: 8px; margin-top: 10px; }
            .footer { border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 20px; font-size: 12px; color: #666; }
            .qr-code { text-align: center; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${title}</div>
            <div style="margin-top: 10px;">
              <span class="badge ${ad.type === 'LOST' ? 'badge-lost' : 'badge-found'}">
                ${ad.type === 'LOST' ? 'ПОТЕРЯН' : 'НАЙДЕН'}
              </span>
              <span class="badge badge-approved">
                ${ad.status === 'APPROVED' ? 'ОПУБЛИКОВАНО' : ad.status}
              </span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Информация о питомце</div>
            ${ad.animalType ? `<div class="info-row"><div class="info-label">Вид животного:</div><div class="info-value">${ad.animalType}</div></div>` : ''}
            ${ad.breed ? `<div class="info-row"><div class="info-label">Порода:</div><div class="info-value">${ad.breed}</div></div>` : ''}
            ${ad.color ? `<div class="info-row"><div class="info-label">Окрас:</div><div class="info-value">${ad.color}</div></div>` : ''}
          </div>

          ${ad.location ? `
            <div class="section">
              <div class="section-title">Местоположение</div>
              ${ad.location.city ? `<div class="info-row"><div class="info-label">Город:</div><div class="info-value">${ad.location.city}</div></div>` : ''}
              ${ad.location.address ? `<div class="info-row"><div class="info-label">Адрес:</div><div class="info-value">${ad.location.address}</div></div>` : ''}
            </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Описание</div>
            <div class="description">${ad.description}</div>
          </div>

          ${ad.user ? `
            <div class="section">
              <div class="section-title">Контактные данные</div>
              ${ad.user.name ? `<div class="info-row"><div class="info-label">Имя:</div><div class="info-value">${ad.user.name}</div></div>` : ''}
              ${ad.user.phone ? `<div class="info-row"><div class="info-label">Телефон:</div><div class="info-value">${ad.user.phone}</div></div>` : ''}
              ${ad.user.email ? `<div class="info-row"><div class="info-label">Email:</div><div class="info-value">${ad.user.email}</div></div>` : ''}
            </div>
          ` : ''}

          <div class="footer">
            <div>Объявление на FindMe</div>
            <div>ID объявления: ${id}</div>
            <div>Ссылка: <a href="${adUrl}">${adUrl}</a></div>
            <div>Экспортировано: ${timestamp}</div>
          </div>
        </body>
      </html>
    `;

    // Open in new window and print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      alert('Не удалось открыть окно печати');
    }
  }

  async function moveToArchive() {
    if (!id) return;
    try {
      await api.post(`/ads/${id}/found`);
      setAd((prev) => (prev ? { ...prev, status: 'ARCHIVED' } : prev));
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось изменить статус'));
    }
  }

  async function submitComplaint() {
    if (!complaintTarget) return;
    if (complaintReason.trim().length < 5) {
      setError('Причина жалобы должна быть не менее 5 символов');
      return;
    }

    setComplaintSubmitting(true);
    setError(null);
    try {
      await api.post('/complaints', {
        targetType: complaintTarget.type,
        targetId: complaintTarget.targetId,
        reason: complaintReason,
        description: complaintDescription || undefined,
      });
      setComplaintTarget(null);
      setComplaintReason('');
      setComplaintDescription('');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Не удалось отправить жалобу'));
    } finally {
      setComplaintSubmitting(false);
    }
  }

  if (error && !ad) return <Container size="4"><Text color="red">{error}</Text></Container>;
  if (!ad) return <Container size="4"><Text>Загрузка...</Text></Container>;

  const isOwner = user?.id === ad.userId;
  const canComplain = !!user && !isOwner;

  return (
    <Flex direction="column" gap="0">
      {/* Header */}
      <Container size="4" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-5)' }}>
        <Card style={{
          background: 'var(--gray-a1)',
          border: '1px solid var(--gray-a7)',
          borderRadius: 'var(--radius-4)',
        }}>
          <Flex direction={{ initial: 'column', md: 'row' }} gap="4" justify="between" align={{ initial: 'start', md: 'center' }} wrap="wrap">
            <Flex direction="column" gap="2">
              <Heading size="5" weight="bold">
                {ad.petName || 'Питомец'}
              </Heading>
              <Flex gap="2" align="center" wrap="wrap">
                <Badge color={ad.type === 'LOST' ? 'orange' : 'green'} size="2" style={{ fontWeight: 600 }}>
                  {ad.type === 'LOST' ? 'потерян' : 'найден'}
                </Badge>
                {ad.status === 'ARCHIVED' ? (
                  <Badge color="green" size="2" style={{ fontWeight: 700 }}>
                    🎉 Питомец найден!
                  </Badge>
                ) : (
                  <Badge color={ad.status === 'APPROVED' ? 'blue' : ad.status === 'PENDING' ? 'amber' : 'gray'} variant="soft" size="2">
                    {adStatusLabel(ad.status)}
                  </Badge>
                )}
              </Flex>
              {[ad.animalType, ad.breed, ad.color].filter(Boolean).length > 0 && (
                <Text size="2" color="gray">
                  {[ad.animalType, ad.breed, ad.color ? `${ad.color}` : null]
                    .filter(Boolean)
                    .join(' • ')}
                </Text>
              )}
            </Flex>
            {ad.location?.city && (
              <Flex gap="2" align="center" style={{ color: 'var(--gray-11)' }}>
                <LocationIcon width={18} height={18} color="var(--violet-10)" />
                <Text size="2" weight="medium">{ad.location.city}</Text>
              </Flex>
            )}
          </Flex>
        </Card>
      </Container>

      <Container size="4" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-6)' }}>
        <Flex direction={{ initial: 'column', md: 'row' }} gap="6">
          {/* Left Column - Media & Map */}
          <Flex direction="column" gap="6" style={{ flex: 2 }}>
            {/* Photo Gallery */}
            {selectedPhoto && (
              <Flex direction="column" gap="4">
                <div
                  style={{
                    width: '100%',
                    height: 'min(500px, 60vh)',
                    borderRadius: 'var(--radius-3)',
                    overflow: 'hidden',
                    background: 'var(--gray-a2)',
                    position: 'relative',
                  }}
                >
                  <img
                    src={selectedPhoto}
                    alt={ad.petName || 'Фото объявления'}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                  
                  {/* Navigation Arrows */}
                  {photos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))}
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(0, 0, 0, 0.6)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '48px',
                          height: '48px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '24px',
                          fontWeight: 'bold',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.background = 'rgba(0, 0, 0, 0.8)';
                          el.style.transform = 'translateY(-50%) scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.background = 'rgba(0, 0, 0, 0.6)';
                          el.style.transform = 'translateY(-50%) scale(1)';
                        }}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(0, 0, 0, 0.6)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '48px',
                          height: '48px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '24px',
                          fontWeight: 'bold',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.background = 'rgba(0, 0, 0, 0.8)';
                          el.style.transform = 'translateY(-50%) scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.background = 'rgba(0, 0, 0, 0.6)';
                          el.style.transform = 'translateY(-50%) scale(1)';
                        }}
                      >
                        ›
                      </button>
                      
                      {/* Counter */}
                      <Flex style={{
                        position: 'absolute',
                        top: 'var(--space-3)',
                        right: 'var(--space-3)',
                        background: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        padding: 'var(--space-2) var(--space-3)',
                        borderRadius: 'var(--radius-2)',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}>
                        {selectedPhotoIndex + 1} / {photos.length}
                      </Flex>
                    </>
                  )}
                </div>

                {/* Photo Thumbnails */}
                {photos.length > 1 && (
                  <Flex gap="2" wrap="wrap" align="center" justify="center">
                    {photos.map((photo, index) => (
                      <button
                        key={photo}
                        type="button"
                        onClick={() => setSelectedPhotoIndex(index)}
                        style={{
                          border: index === selectedPhotoIndex ? '3px solid var(--violet-8)' : '2px solid var(--gray-a6)',
                          borderRadius: 'var(--radius-2)',
                          padding: 0,
                          overflow: 'hidden',
                          background: 'transparent',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          width: '80px',
                          height: '80px',
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.transform = 'scale(1)';
                        }}
                      >
                        <img
                          src={photo}
                          alt={`Фото ${index + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </button>
                    ))}
                  </Flex>
                )}
              </Flex>
            )}

            {/* Description */}
            <Card style={{
              background: 'var(--gray-a1)',
              border: '1px solid var(--gray-a7)',
              borderRadius: 'var(--radius-3)',
            }}>
              <Flex direction="column" gap="3">
                <Flex gap="2" align="center">
                  <DescriptionIcon width={20} height={20} color="var(--gray-11)" />
                  <Heading size="4" weight="bold">Описание</Heading>
                </Flex>
                <Text style={{ lineHeight: '1.7' }} color="gray">{ad.description}</Text>
              </Flex>
            </Card>

            {/* Location */}
            {ad.location && (
              <Card style={{
                background: 'var(--gray-a1)',
                border: '1px solid var(--gray-a7)',
                borderRadius: 'var(--radius-3)',
              }}>
                <Flex direction="column" gap="3">
                  <Flex gap="2" align="center">
                    <LocationIcon width={20} height={20} color="var(--violet-10)" />
                    <Heading size="4" weight="bold">Местоположение</Heading>
                  </Flex>
                  <Flex direction="column" gap="2">
                    {ad.location.city && (
                      <Flex justify="between">
                        <Text weight="bold" color="gray">Город:</Text>
                        <Text>{ad.location.city}</Text>
                      </Flex>
                    )}
                    {ad.location.address && (
                      <Flex justify="between">
                        <Text weight="bold" color="gray">Адрес:</Text>
                        <Text>{ad.location.address}</Text>
                      </Flex>
                    )}
                  </Flex>
                  <AdLocationMap location={ad.location} type={ad.type} height={320} />
                </Flex>
              </Card>
            )}

            {/* Pet Info */}
            <Card style={{
              background: 'var(--gray-a1)',
              border: '1px solid var(--gray-a7)',
              borderRadius: 'var(--radius-3)',
            }}>
              <Flex direction="column" gap="3">
                <Flex gap="2" align="center">
                  <PawIcon width={20} height={20} color="var(--orange-10)" />
                  <Heading size="4" weight="bold">Информация о питомце</Heading>
                </Flex>
                <Flex direction="column" gap="2">
                  {ad.animalType && (
                    <Flex justify="between">
                      <Text weight="bold" color="gray">Вид:</Text>
                      <Text>{ad.animalType}</Text>
                    </Flex>
                  )}
                  {ad.breed && (
                    <Flex justify="between">
                      <Text weight="bold" color="gray">Порода:</Text>
                      <Text>{ad.breed}</Text>
                    </Flex>
                  )}
                  {ad.color && (
                    <Flex justify="between">
                      <Text weight="bold" color="gray">Окрас:</Text>
                      <Text>{ad.color}</Text>
                    </Flex>
                  )}
                </Flex>
              </Flex>
            </Card>
          </Flex>

          {/* Right Column - User & Actions */}
          <Flex direction="column" gap="4" style={{ flex: 1, minWidth: '280px' }}>
            {/* User Card */}
            <Card style={{
              background: 'var(--violet-1)',
              border: '1px solid var(--violet-a6)',
              borderRadius: 'var(--radius-3)',
            }}>
              <Flex direction="column" gap="3">
                <Flex gap="2" align="center">
                  <UserIcon width={18} height={18} color="var(--violet-10)" />
                  <Text size="2" weight="bold" color="gray">Автор объявления</Text>
                </Flex>
                {ad.user?.id ? (
                  <UserAvatarLink
                    userId={ad.user.id}
                    name={ad.user.name}
                    email={ad.user.email}
                    avatarUrl={ad.user.avatarUrl}
                  />
                ) : (
                  <Text>Пользователь</Text>
                )}
              </Flex>
            </Card>

            {/* Contact Info */}
            {ad.user && (ad.user.phone || ad.user.email || ad.user.telegramUsername) && (
              <Card style={{
                background: 'var(--green-a1)',
                border: '1px solid var(--green-a6)',
                borderRadius: 'var(--radius-3)',
              }}>
                <Flex direction="column" gap="3">
                  <Flex gap="2" align="center">
                    <PhoneIcon width={18} height={18} color="var(--green-10)" />
                    <Text size="2" weight="bold" color="gray">Контакты</Text>
                  </Flex>
                  <Flex direction="column" gap="2">
                    {ad.user.phone && (
                      <Flex gap="2" align="center">
                        <PhoneIcon width={16} height={16} color="var(--green-10)" />
                        <a href={`tel:${ad.user.phone}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <Text size="2" style={{ wordBreak: 'break-all', color: 'var(--blue-11)', cursor: 'pointer' }}>
                            {ad.user.phone}
                          </Text>
                        </a>
                      </Flex>
                    )}
                    {ad.user.telegramUsername && (
                      <Flex gap="2" align="center">
                        <MessageIcon width={16} height={16} color="var(--green-10)" />
                        <a href={`https://t.me/${ad.user.telegramUsername}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                          <Text size="2" style={{ wordBreak: 'break-all', color: 'var(--blue-11)', cursor: 'pointer' }}>
                            @{ad.user.telegramUsername}
                          </Text>
                        </a>
                      </Flex>
                    )}
                    {ad.user.email && (
                      <Flex gap="2" align="center">
                        <MailIcon width={16} height={16} color="var(--green-10)" />
                        <a href={`mailto:${ad.user.email}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <Text size="2" style={{ wordBreak: 'break-all', color: 'var(--blue-11)', cursor: 'pointer' }}>
                            {ad.user.email}
                          </Text>
                        </a>
                      </Flex>
                    )}
                  </Flex>
                </Flex>
              </Card>
            )}

            {/* Actions */}
            <Flex direction="column" gap="2">
              {!isOwner && user && (
                <>
                  <Button
                    onClick={() => void startChat()}
                    size="3"
                    style={{ width: '100%', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <Flex align="center" gap="2"><MessageIcon width={16} height={16} />Написать сообщение</Flex>
                  </Button>
                  <Button
                    variant="soft"
                    onClick={() => void shareAd()}
                    size="2"
                    style={{ width: '100%', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <Flex align="center" gap="2"><ShareIcon width={16} height={16} />Поделиться</Flex>
                  </Button>
                </>
              )}

              <Button
                variant="soft"
                onClick={() => void exportToPdf()}
                size="2"
                style={{ width: '100%', fontWeight: 600, cursor: 'pointer' }}
              >
                <Flex align="center" gap="2"><PrintIcon width={16} height={16} />Экспортировать PDF</Flex>
              </Button>

              <Flex gap="2">
                <Button
                  variant="soft"
                  onClick={() => void shareAd()}
                  size="2"
                  style={{ flex: 1, fontWeight: 600, cursor: 'pointer' }}
                >
                  <Flex align="center" gap="2"><ShareIcon width={16} height={16} />Поделиться</Flex>
                </Button>
                <Button
                  variant={isFavorite ? 'solid' : 'soft'}
                  color={isFavorite ? 'red' : 'gray'}
                  onClick={() => id && toggleFavorite(id)}
                  size="2"
                  style={{ flex: 1, fontWeight: 600, cursor: 'pointer' }}
                >
                  <Flex align="center" gap="2">
                    {isFavorite
                      ? <><HeartFilledIcon width={16} height={16} color="white" />В избранном</>
                      : <><HeartIcon width={16} height={16} />В избранное</>
                    }
                  </Flex>
                </Button>
              </Flex>

              {isOwner && ad.status !== 'ARCHIVED' && (
                <ConfirmActionDialog
                  title="Питомец найден?"
                  description="Объявление будет помечено как завершённое. Поздравляем с хорошим концом!"
                  confirmText="Да, питомец найден!"
                  color="green"
                  onConfirm={moveToArchive}
                  trigger={
                    <Button
                      color="green"
                      style={{ width: '100%', fontWeight: 600, cursor: 'pointer' }}
                    >
                      <Flex align="center" gap="2">🎉 Питомец найден!</Flex>
                    </Button>
                  }
                />
              )}

              {ad.status === 'ARCHIVED' && (
                <Card style={{
                  background: 'var(--green-a2)',
                  border: '1px solid var(--green-a6)',
                  borderRadius: 'var(--radius-3)',
                  padding: 'var(--space-3)',
                }}>
                  <Flex align="center" gap="2" justify="center">
                    <Text size="3">🎉</Text>
                    <Text size="2" weight="bold" color="green">Питомец найден!</Text>
                  </Flex>
                </Card>
              )}

              {!user && (
                <Button
                  onClick={() => navigate('/login')}
                  size="3"
                  style={{ width: '100%', fontWeight: 600, cursor: 'pointer' }}
                >
                  Войти для связи
                </Button>
              )}

              {canComplain && (
                <Button
                  color="orange"
                  variant="soft"
                  onClick={() => setComplaintTarget({ type: 'AD', targetId: ad.id, title: 'Жалоба на объявление' })}
                  size="2"
                  style={{ width: '100%', fontWeight: 600, cursor: 'pointer', marginTop: 'var(--space-2)' }}
                >
                  <Flex align="center" gap="2"><AlertTriangleIcon width={16} height={16} />Пожаловаться</Flex>
                </Button>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Container>

      <Dialog.Root open={!!complaintTarget} onOpenChange={(open) => !open && setComplaintTarget(null)}>
        <Dialog.Content maxWidth="560px">
          <Dialog.Title>{complaintTarget?.title || 'Жалоба'}</Dialog.Title>
          <Dialog.Description size="2" mb="3">
            Опишите проблему. Жалоба попадет в админ-панель на модерацию.
          </Dialog.Description>

          <Flex direction="column" gap="3">
            <TextField.Root
              placeholder="Причина жалобы"
              value={complaintReason}
              onChange={(event) => setComplaintReason(event.target.value)}
            />
            <TextArea
              placeholder="Дополнительное описание (необязательно)"
              value={complaintDescription}
              onChange={(event) => setComplaintDescription(event.target.value)}
            />
          </Flex>

          <Flex gap="3" justify="end" mt="4">
            <Dialog.Close>
              <Button variant="soft" type="button">Отмена</Button>
            </Dialog.Close>
            <Button type="button" onClick={() => void submitComplaint()} disabled={complaintSubmitting}>
              {complaintSubmitting ? 'Отправка...' : 'Отправить'}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Flex>
  );
}
