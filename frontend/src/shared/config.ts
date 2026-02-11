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
};
