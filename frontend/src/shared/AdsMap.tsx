import { Badge, Button, Card, Flex, Text } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { LayersControl, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { MAP_TILES } from './mapTiles';
import { useGeolocationCenter } from './useGeolocationCenter';

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
};

export default function AdsMap({ ads }: { ads: MapAd[] }) {
  const points = ads
    .filter((ad) => ad.location && typeof ad.location.latitude === 'number' && typeof ad.location.longitude === 'number')
    .map((ad) => ({
      id: ad.id,
      type: ad.type,
      status: ad.status,
      petName: ad.petName,
      lat: ad.location!.latitude as number,
      lng: ad.location!.longitude as number,
      address: ad.location?.address,
      city: ad.location?.city,
    }))
    .filter((point) => Math.abs(point.lat) > 0.0001 || Math.abs(point.lng) > 0.0001);

  if (points.length === 0) {
    return (
      <Card>
        <Text color="gray">Нет координат для отображения на карте.</Text>
      </Card>
    );
  }

  const geo = useGeolocationCenter({ timeoutMs: 2500 });
  const fallbackMinsk = { lat: 53.902334, lng: 27.5618791 };

  const bounds = useMemo(() => points.map((p) => [p.lat, p.lng] as [number, number]), [points]);

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

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ height: 360, width: '100%' }}>
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
          {points.map((point) => (
            <Marker key={point.id} position={[point.lat, point.lng]}>
              <Popup>
                <Card style={{ padding: 10, minWidth: 220 }}>
                  <Flex direction="column" gap="2">
                    <Flex align="center" justify="between" gap="2">
                      <Text weight="bold" className="truncate">
                        {point.petName || 'Питомец'}
                      </Text>
                      {point.type === 'LOST' && <Badge color="red">Потерян</Badge>}
                      {point.type === 'FOUND' && <Badge color="green">Найден</Badge>}
                    </Flex>
                    <Text size="2" color="gray" className="truncate">
                      {point.city || 'Город не указан'}
                    </Text>
                    <Text size="2" color="gray" className="truncate">
                      {point.address || 'Адрес не указан'}
                    </Text>
                    <Button asChild size="2" style={{ cursor: 'pointer' }}>
                      <Link to={`/ads/${point.id}`}>Открыть объявление</Link>
                    </Button>
                  </Flex>
                </Card>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </Card>
  );
}
