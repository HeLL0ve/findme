import { Card, Text } from '@radix-ui/themes';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

type MapAd = {
  id: string;
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

  const center = { lat: points[0].lat, lng: points[0].lng };

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ height: 360, width: '100%' }}>
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {points.map((point) => (
            <Marker key={point.id} position={[point.lat, point.lng]}>
              <Popup>
                <div>
                  <strong>{point.petName || 'Питомец'}</strong>
                  <div>{point.city || 'Город не указан'}</div>
                  <div>{point.address || 'Адрес не указан'}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </Card>
  );
}
