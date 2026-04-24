import L from 'leaflet';

function createSvgIcon(color: string, strokeColor: string): L.DivIcon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <defs>
        <filter id="shadow" x="-30%" y="-10%" width="160%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
        </filter>
      </defs>
      <path
        d="M16 2C9.373 2 4 7.373 4 14c0 9 12 26 12 26S28 23 28 14C28 7.373 22.627 2 16 2z"
        fill="${color}"
        stroke="${strokeColor}"
        stroke-width="1.5"
        filter="url(#shadow)"
      />
      <circle cx="16" cy="14" r="5" fill="white" opacity="0.9"/>
    </svg>
  `.trim();

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -44],
  });
}

export const lostIcon = createSvgIcon('#e5484d', '#b91c1c');   // red — потерян
export const foundIcon = createSvgIcon('#30a46c', '#15803d');  // green — найден
export const defaultIcon = createSvgIcon('#6e56cf', '#5b21b6'); // violet — без типа
