import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@radix-ui/themes/styles.css';
import 'leaflet/dist/leaflet.css';
import './styles/theme.css';
import './styles/index.css';
import App from './app/App.tsx';
import './shared/leaflet';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
