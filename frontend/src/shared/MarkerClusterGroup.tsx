/**
 * MarkerClusterGroup wrapper for react-leaflet v4+
 * Uses leaflet.markercluster under the hood.
 */
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

type Props = {
  children?: React.ReactNode;
  markers: {
    id: string;
    lat: number;
    lng: number;
    icon: L.DivIcon;
    popup: string; // raw HTML string
  }[];
};

export default function MarkerClusterGroup({ markers }: Props) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    // Create cluster group with custom cluster icon
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 60,
      iconCreateFunction(c) {
        const count = c.getChildCount();
        return L.divIcon({
          html: `
            <div style="
              background: #6e56cf;
              color: white;
              border-radius: 50%;
              width: 38px;
              height: 38px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: 14px;
              border: 3px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            ">${count}</div>
          `,
          className: '',
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });
      },
    });

    for (const m of markers) {
      const marker = L.marker([m.lat, m.lng], { icon: m.icon });
      marker.bindPopup(m.popup, { maxWidth: 280, minWidth: 220 });
      cluster.addLayer(marker);
    }

    map.addLayer(cluster);
    clusterRef.current = cluster;

    return () => {
      map.removeLayer(cluster);
    };
    // Re-create when markers change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, JSON.stringify(markers.map((m) => m.id))]);

  return null;
}
