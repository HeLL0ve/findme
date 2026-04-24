import { Badge, Button, Card, Flex, Text } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { LayersControl, MapContainer, TileLayer, useMap } from 'react-leaflet';
import { MAP_TILES } from './mapTiles';
import { useGeolocationCenter } from './useGeolocationCenter';
import { lostIcon, foundIcon, defaultIcon } from './mapIcons';
import MarkerClusterGroup from './MarkerClusterGroup';
import { config } from './config';

type MapAd = {
  id: string;
  type?: 'LOST' | 'FOUND' | string | null;
  status?: string | null;
  petName?: string | null;
  location?: {
    latitude?: number | null;
    longitude?: number | null;
    address?: string | null;
    city?: string | null;
  } | null;
  photos?: Array<{ photoUrl: string }>;
};

function getIcon(type?: string | null) {
  if (type === 'LOST') return lostIcon;
  if (type === 'FOUND') return foundIcon;
  return defaultIcon;
}

function resolvePhotoSrc(photoUrl: string): string {
  if (photoUrl.startsWith('http')) return photoUrl;
  return `${config.apiUrl || ''}${photoUrl}`;
}

function buildPopupHtml(point: {
  id: string;
  type?: string | null;
  petName?: string | null;
  city?: string | null;
  address?: string | null;
  photoUrl?: string | null;
}): string {
  const typeBadge =
    point.type === 'LOST'
      ? `<span style="background:#ffe4e6;color:#b91c1c;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:600;">Потерян</span>`
      : point.type === 'FOUND'
      ? `<span style="background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:600;">Найден</span>`
      : '';

  const photoHtml = point.photoUrl
    ? `<div style="margin-bottom:10px;border-radius:8px;overflow:hidden;height:140px;">
         <img src="${point.photoUrl}" alt="Фото" style="width:100%;height:100%;object-fit:cover;" />
       </div>`
    : '';

  return `
    <div style="min-width:200px;font-family:inherit;">
      ${photoHtml}
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
        <strong style="font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          ${point.petName ?? 'Питомец'}
        </strong>
        ${typeBadge}
      </div>
      <div style="font-size:12px;color:#888;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
        ${point.city ?? 'Город не указан'}
      </div>
      <div style="font-size:12px;color:#888;margin-bottom:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
        ${point.address ?? 'Адрес не указан'}
      </div>
      <a href="/ads/${point.id}"
        style="display:block;text-align:center;background:#6e56cf;color:white;padding:6px 12px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">
        Открыть объявление
      </a>
    </div>
  `.trim();
}

export default function AdsMap({ ads, height }: { ads: MapAd[]; height?: string | number }) {
  const points = ads
    .filter(
      (ad) =>
        ad.location &&
        typeof ad.location.latitude === 'number' &&
        typeof ad.location.longitude === 'number',
    )
    .map((ad) => ({
      id: ad.id,
      type: ad.type,
      status: ad.status,
      petName: ad.petName,
      lat: ad.location!.latitude as number,
      lng: ad.location!.longitude as number,
      address: ad.location?.address,
      city: ad.location?.city,
      photoUrl: ad.photos?.[0]?.photoUrl ? resolvePhotoSrc(ad.photos[0].photoUrl) : null,
    }))
    .filter((p) => Math.abs(p.lat) > 0.0001 || Math.abs(p.lng) > 0.0001);

  if (points.length === 0) {
    return (
      <Card>
        <Text color="gray">Нет координат для отображения на карте.</Text>
      </Card>
    );
  }

  const geo = useGeolocationCenter({ timeoutMs: 2500 });
  const fallbackMinsk = { lat: 53.902334, lng: 27.5618791 };

  const bounds = useMemo(
    () => points.map((p) => [p.lat, p.lng] as [number, number]),
    [points],
  );

  const markers = useMemo(
    () =>
      points.map((p) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        icon: getIcon(p.type),
        popup: buildPopupHtml(p),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [points.map((p) => p.id).join(',')],
  );

  function FitBoundsOnce() {
    const map = useMap();
    useEffect(() => {
      if (bounds.length === 1) {
        map.setView(bounds[0], 13, { animate: false });
        return;
      }
      map.fitBounds(bounds, { padding: [24, 24] });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return null;
  }

  const mapHeight = height ?? '100%';

  return (
    <div style={{ height: mapHeight, width: '100%' }}>
      <MapContainer
        center={(geo.status === 'ready' ? geo.center : null) ?? fallbackMinsk}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
      >
        <LayersControl position="topright">
          {MAP_TILES.map((tile, index) => (
            <LayersControl.BaseLayer key={tile.id} name={tile.name} checked={index === 0}>
              <TileLayer attribution={tile.attribution} url={tile.url} maxZoom={tile.maxZoom} />
            </LayersControl.BaseLayer>
          ))}
        </LayersControl>
        <FitBoundsOnce />
        <MarkerClusterGroup markers={markers} />
      </MapContainer>
    </div>
  );
}
