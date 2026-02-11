import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { Card, Text } from '@radix-ui/themes';

type MapAd = {
  id: string;
  petName?: string | null;
  location?: { latitude?: number | null; longitude?: number | null; address?: string | null; city?: string | null } | null;
};

export default function AdsMap({ ads }: { ads: MapAd[] }) {
  const points = ads
    .filter((a) => a.location && typeof a.location.latitude === 'number' && typeof a.location.longitude === 'number')
    .map((a) => ({
      id: a.id,
      petName: a.petName,
      lat: a.location!.latitude as number,
      lng: a.location!.longitude as number,
      address: a.location?.address,
      city: a.location?.city,
    }))
    .filter((p) => Math.abs(p.lat) > 0.0001 || Math.abs(p.lng) > 0.0001);

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
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {points.map((p) => (
            <Marker key={p.id} position={[p.lat, p.lng]}>
              <Popup>
                <div>
                  <strong>{p.petName || 'Питомец'}</strong>
                  <div>{p.city || ''}</div>
                  <div>{p.address || ''}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </Card>
  );
}
