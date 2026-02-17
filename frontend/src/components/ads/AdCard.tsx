import { Badge, Card, Flex, Text } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { type ReactNode } from 'react';
import { config } from '../../shared/config';
import { adStatusLabel, adTypeLabel } from '../../shared/labels';

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
  imageHeight = 230,
}: AdCardProps) {
  const photoSrc = resolvePhotoSrc(ad.photos?.[0]?.photoUrl);

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
          <Flex direction="column" gap="3">
            <div
              style={{
                width: '100%',
                height: imageHeight,
                borderRadius: 12,
                background: 'var(--accent-soft)',
                overflow: 'hidden',
              }}
            >
              {photoSrc ? (
                <img
                  src={photoSrc}
                  alt={ad.petName || 'Фото объявления'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : null}
            </div>

            <Flex direction="column" gap="1" style={{ minWidth: 0 }}>
              <Text weight="bold" className="truncate">{ad.petName || 'Без клички'}</Text>
              <Text size="2" color="gray" className="truncate">
                {[ad.animalType || 'Не указано', ad.breed || null, ad.color ? `окрас: ${ad.color}` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              {showDescription && ad.description && (
                <Text size="2" color="gray" className="truncate-2">
                  {ad.description}
                </Text>
              )}
              <Flex gap="2" wrap="wrap">
                <Badge color={ad.type === 'LOST' ? 'orange' : 'green'}>{adTypeLabel(ad.type)}</Badge>
                <Badge color={ad.status === 'APPROVED' ? 'blue' : 'gray'}>{adStatusLabel(ad.status)}</Badge>
              </Flex>
            </Flex>
          </Flex>
        </Link>

        {actions && (
          <Flex gap="2" wrap="wrap">
            {actions}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
