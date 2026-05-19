import { Card, Text } from '@radix-ui/themes';
import { useMemo } from 'react';
import { LayersControl, MapContainer, TileLayer } from 'react-leaflet';
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

function MapLegend() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        backgroundColor: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 400,
        fontFamily: 'inherit',
        fontSize: '13px',
      }}
    >
      <div style={{ marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>Условные обозначения:</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#e5484d',
              border: '2px solid #b91c1c',
              flexShrink: 0,
            }}
          />
          <span>Потеряно</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#30a46c',
              border: '2px solid #15803d',
              flexShrink: 0,
            }}
          />
          <span>Найдено</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#6e56cf',
              border: '2px solid #5b21b6',
              flexShrink: 0,
            }}
          />
          <span>Без типа</span>
        </div>
      </div>
    </div>
  );
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

  const mapHeight = height ?? '100%';
  const center = (geo.status === 'ready' ? geo.center : null) ?? fallbackMinsk;

  return (
    <div style={{ height: mapHeight, width: '100%', position: 'relative' }}>
      <MapContainer
        center={center}
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
        <MarkerClusterGroup markers={markers} />
      </MapContainer>
      <MapLegend />
    </div>
  );
}
