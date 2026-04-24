export type MapTile = {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom?: number;
};

// Detect browser language for map tiles that support localization
function getBrowserLang(): string {
  const lang = navigator.language || 'en';
  return lang.split('-')[0]; // e.g. "ru", "en", "de", "be"
}

export function getMapTiles(): MapTile[] {
  const lang = getBrowserLang();

  return [
    {
      id: 'osm',
      name: 'Схема (OSM)',
      // Wikimedia OSM supports ?lang= for localized labels
      url: `https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png?lang=${lang}`,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://maps.wikimedia.org">Wikimedia Maps</a>',
      maxZoom: 19,
    },
    {
      id: 'carto-light',
      name: 'Светлая (CARTO)',
      // CARTO doesn't support lang parameter directly, but uses OSM data which respects name:lang tags
      // For better localization, we can use OSM-based tiles with lang support
      url: `https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png?lang=${lang}`,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://maps.wikimedia.org">Wikimedia Maps</a>',
      maxZoom: 19,
    },
    {
      id: 'carto-dark',
      name: 'Тёмная (CARTO)',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 20,
    },
    {
      id: 'carto-voyager',
      name: 'Voyager (CARTO)',
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 20,
    },
    {
      id: 'esri-satellite',
      name: 'Спутник (ESRI)',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 19,
    },
    {
      id: 'esri-topo',
      name: 'Топо (ESRI)',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
      maxZoom: 19,
    },
    {
      id: 'topo',
      name: 'Топографическая (OSM)',
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
      maxZoom: 17,
    },
  ];
}

// Static export for backward compat (uses lang at module load time)
export const MAP_TILES: MapTile[] = getMapTiles();
