export type MapTile = {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom?: number;
};

// All sources below are freely accessible tile servers.
// Note: providers may enforce fair-use limits; consider self-hosting for production.
export const MAP_TILES: MapTile[] = [
  {
    id: 'osm',
    name: 'Схема (OSM)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  {
    id: 'wikimedia',
    name: 'Схема (Wikimedia)',
    url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  {
    id: 'carto-light',
    name: 'Светлая (CARTO)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 20,
  },
  {
    id: 'carto-dark',
    name: 'Тёмная (CARTO)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 20,
  },
  {
    id: 'topo',
    name: 'Топографическая',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
    maxZoom: 17,
  },
];

