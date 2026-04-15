import { Badge, Card, Flex, Text, Box, Heading } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { type ReactNode } from 'react';
import { config } from '../../shared/config';

export type AdCardData = {
  id: string;
  petName?: string | null;
  animalType?: string | null;
  breed?: string | null;
  color?: string | null;
  description?: string | null;
  status: string;
  type: 'LOST' | 'FOUND';
  photos?: Array<{ photoUrl: string }>;
};

type AdCardProps = {
  ad: AdCardData;
  to?: string;
  actions?: ReactNode;
  showDescription?: boolean;
  imageHeight?: number;
};

function resolvePhotoSrc(photoUrl?: string) {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http')) return photoUrl;
  return `${config.apiUrl || ''}${photoUrl}`;
}

export default function AdCard({
  ad,
  to = `/ads/${ad.id}`,
  actions,
  showDescription = true,
  imageHeight = 240,
}: AdCardProps) {
  const photoSrc = resolvePhotoSrc(ad.photos?.[0]?.photoUrl);

  return (
    <Card style={{
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      height: '100%',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, var(--surface) 0%, var(--gray-a1) 100%)',
      border: '1px solid var(--gray-a5)',
    }} onMouseEnter={(e) => {
      const card = e.currentTarget as HTMLElement;
      card.style.transform = 'translateY(-8px)';
      card.style.boxShadow = '0 20px 48px rgba(0, 0, 0, 0.2)';
      card.style.borderColor = 'var(--violet-a5)';
    }} onMouseLeave={(e) => {
      const card = e.currentTarget as HTMLElement;
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = '';
      card.style.borderColor = 'var(--gray-a5)';
    }}>
      <Flex direction="column" gap="3" style={{ height: '100%' }}>
        <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
          <Flex direction="column" gap="3" style={{ height: '100%' }}>
            {/* Image Container */}
            <Box style={{
              width: '100%',
              height: imageHeight,
              borderRadius: 'var(--radius-2)',
              background: 'linear-gradient(135deg, var(--gray-a2) 0%, var(--gray-a3) 100%)',
              overflow: 'hidden',
              position: 'relative',
            }}>
              {photoSrc ? (
                <>
                  <img
                    src={photoSrc}
                    alt={ad.petName || 'Фото объявления'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)';
                    }}
                  />
                </>
              ) : null}
            </Box>

            {/* Content */}
            <Flex direction="column" gap="2" style={{ minWidth: 0, flex: 1 }}>
              {/* Type & Status Badges - moved from image */}
              <Flex gap="2" wrap="wrap" align="center">
                <Badge color={ad.type === 'LOST' ? 'orange' : 'green'} size="2" style={{ fontWeight: 600 }}>
                  {ad.type === 'LOST' ? 'потерян' : 'найден'}
                </Badge>
                <Badge
                  color={ad.status === 'APPROVED' ? 'blue' : ad.status === 'PENDING' ? 'amber' : 'gray'}
                  variant="soft"
                  size="1"
                  style={{
                    fontSize: '10px',
                    textTransform: 'uppercase',
                  }}
                >
                  {ad.status === 'APPROVED' ? 'опубл.' : ad.status === 'PENDING' ? 'на модер.' : 'архив'}
                </Badge>
              </Flex>

              {/* Pet Name */}
              <Heading size="3" weight="bold" className="truncate" style={{
                fontSize: 'var(--font-size-5)',
              }}>
                {ad.petName || 'Без клички'}
              </Heading>

              {/* Type and color */}
              <Text size="1" color="gray" className="truncate" style={{
                fontSize: 'var(--font-size-1)',
                lineHeight: '1.4',
              }}>
                {[ad.animalType || 'Не указано', ad.breed || null, ad.color ? `окрас: ${ad.color}` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>

              {/* Description */}
              {showDescription && ad.description && (
                <Text size="2" color="gray" style={{
                  fontSize: 'var(--font-size-2)',
                  lineHeight: '1.5',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  marginTop: 'var(--space-1)',
                }}>
                  {ad.description}
                </Text>
              )}
            </Flex>
          </Flex>
        </Link>

        {/* Actions */}
        {actions && (
          <Flex gap="2" wrap="wrap" style={{
            marginTop: 'auto',
            paddingTop: 'var(--space-2)',
            borderTop: '1px solid var(--gray-a5)',
          }}>
            {actions}
          </Flex>
        )}
      </Flex>

      <style>{`
        .truncate {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .truncate-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </Card>
  );
}
