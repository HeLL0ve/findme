function normalizeWsUrl(apiUrl: string | undefined) {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL as string;
  if (!apiUrl) return 'ws://localhost:3000/ws';
  try {
    const url = new URL(apiUrl);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = '/ws';
    return url.toString();
  } catch (_) {
    return 'ws://localhost:3000/ws';
  }
}

export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  wsUrl: normalizeWsUrl(import.meta.env.VITE_API_URL),
  telegramChannelUrl: 'https://t.me/findme_by', // Будет загружено с сервера
};

// Загрузка публичной конфигурации с сервера
export async function loadPublicConfig() {
  try {
    const response = await fetch(`${config.apiUrl || 'http://localhost:3000'}/health/config`);
    if (response.ok) {
      const data = await response.json();
      if (data.telegramChannelUrl) {
        config.telegramChannelUrl = data.telegramChannelUrl;
      }
    }
  } catch (error) {
    console.warn('Failed to load public config:', error);
  }
}
