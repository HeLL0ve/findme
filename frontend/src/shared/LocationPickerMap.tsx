import { Box, Button, Card, Flex, Text } from '@radix-ui/themes';
import { useEffect, useMemo } from 'react';
import { LayersControl, MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import { MAP_TILES } from './mapTiles';
import { useGeolocationCenter } from './useGeolocationCenter';
import { defaultIcon } from './mapIcons';

type LatLng = { lat: number; lng: number };

type ReverseLocation = {
  address: string;
  city: string;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeCity(address: Record<string, any>): string {
  return (
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.suburb ||
    address.county ||
    address.state ||
    ''
  );
}

function buildAddressFromReverse(data: any): ReverseLocation {
  const address = data.address || {};
  const shortAddress = [
    address.road,
    address.house_number,
    address.pedestrian,
    address.neighbourhood,
    address.suburb,
  ]
    .filter(Boolean)
    .join(', ');

  return {
    address: shortAddress || data.display_name || '',
    city: normalizeCity(address),
  };
}

function ClickToSetMarker({ onPick }: { onPick: (point: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function RecenterOnGeo(props: { enabled: boolean; center: LatLng | null }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (!props.enabled) return;
    if (!props.center) return;
    map.setView([props.center.lat, props.center.lng], Math.max(map.getZoom(), 12), { animate: false });
  }, [map, props.center, props.enabled]);
  return null;
}

export function LocationPickerMap(props: {
  value?: { latitude?: number | null; longitude?: number | null } | null;
  onChange: (next: { latitude: number; longitude: number } | null) => void;
  onAddressChange?: (next: { address: string; city: string }) => void;
  height?: number;
}) {
  const height = props.height ?? 360;

  const geo = useGeolocationCenter({ timeoutMs: 2500 });

  const picked = useMemo(() => {
    const lat = props.value?.latitude ?? null;
    const lng = props.value?.longitude ?? null;
    if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) return null;
    if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return null;
    return { lat, lng };
  }, [props.value?.latitude, props.value?.longitude]);

  const fallbackMinsk: LatLng = { lat: 53.902334, lng: 27.5618791 };
  const center: LatLng = picked ?? geo.center ?? fallbackMinsk;

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <Box style={{ height, width: '100%' }}>
        <MapContainer
          center={center}
          zoom={picked ? 14 : 10}
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

          <RecenterOnGeo enabled={!picked} center={geo.status === 'ready' ? geo.center : null} />
          <ClickToSetMarker onPick={(point) => {
            props.onChange({ latitude: point.lat, longitude: point.lng });
            if (!props.onAddressChange) return;
            fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&accept-language=ru&lat=${encodeURIComponent(
                point.lat,
              )}&lon=${encodeURIComponent(point.lng)}`,
            )
              .then(async (response) => {
                if (!response.ok) throw new Error('Reverse geocode failed');
                return response.json();
              })
              .then((data) => {
                const next = buildAddressFromReverse(data);
                props.onAddressChange?.(next);
              })
              .catch(() => {
                // fail silently if reverse geocoding is unavailable
              });
          }} />
          {picked && <Marker position={[picked.lat, picked.lng]} icon={defaultIcon} />}
        </MapContainer>
      </Box>

      <Flex justify="between" align="center" gap="3" style={{ padding: 'var(--space-3)' }}>
        <Text size="2" color="gray">
          Кликните по карте, чтобы поставить метку. Координаты сохранятся в объявлении.
        </Text>
        <Button
          type="button"
          variant="soft"
          color="gray"
          onClick={() => props.onChange(null)}
          disabled={!picked}
          style={{ cursor: 'pointer' }}
        >
          Очистить метку
        </Button>
      </Flex>
    </Card>
  );
}
