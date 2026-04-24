import { Card, Text } from '@radix-ui/themes';
import { useMemo } from 'react';
import { LayersControl, MapContainer, Marker, TileLayer } from 'react-leaflet';
import { MAP_TILES } from './mapTiles';
import { useGeolocationCenter } from './useGeolocationCenter';
import { defaultIcon } from './mapIcons';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function AdLocationMap(props: {
  location?: { latitude?: number | null; longitude?: number | null } | null;
  type?: 'LOST' | 'FOUND' | string | null;
  height?: number;
}) {
  const height = props.height ?? 320;
  const geo = useGeolocationCenter({ timeoutMs: 2500 });
  const fallbackMinsk = { lat: 53.902334, lng: 27.5618791 };

  const point = useMemo(() => {
    const lat = props.location?.latitude ?? null;
    const lng = props.location?.longitude ?? null;
    if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) return null;
    if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return null;
    return { lat, lng };
  }, [props.location?.latitude, props.location?.longitude]);

  if (!point) {
    return (
      <Card>
        <Text color="gray">Координаты не указаны.</Text>
      </Card>
    );
  }

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ height, width: '100%' }}>
        <MapContainer
          center={point ?? (geo.status === 'ready' ? geo.center : null) ?? fallbackMinsk}
          zoom={14}
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
          <Marker position={[point.lat, point.lng]} icon={defaultIcon} />
        </MapContainer>
      </div>
    </Card>
  );
}
