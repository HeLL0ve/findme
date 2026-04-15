import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@radix-ui/themes/styles.css';
import 'leaflet/dist/leaflet.css';
import './styles/theme.css';
import './styles/index.css';
import App from './app/App.tsx';
import './shared/leaflet';

// Initialize theme from localStorage on page load
const savedAppearance = localStorage.getItem('appearance') as 'light' | 'dark' | null;
const appearance = savedAppearance === 'dark' ? 'dark' : 'light';
if (appearance === 'dark') {
  document.documentElement.classList.add('dark-mode');
  document.documentElement.classList.remove('light-mode');
} else {
  document.documentElement.classList.add('light-mode');
  document.documentElement.classList.remove('dark-mode');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
