import { config } from './config';

type Listener = (msg: any) => void;

let ws: WebSocket | null = null;
let listeners = new Set<Listener>();
let currentToken: string | null = null;
let lastOnlineCount: number | null = null;

function emit(msg: any) {
  if (msg?.type === 'online:count') {
    lastOnlineCount = Number(msg.count || 0);
  }
  for (const l of listeners) l(msg);
}

function buildUrl(token: string | null) {
  const url = new URL(config.wsUrl);
  if (token) url.searchParams.set('token', token);
  return url.toString();
}

export function connectWs(token: string | null) {
  if (ws && currentToken === token && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  currentToken = token;
  if (ws) {
    try { ws.close(); } catch (_) {}
  }

  ws = new WebSocket(buildUrl(token));

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      emit(msg);
    } catch (_) {}
  };

  ws.onclose = () => {
    ws = null;
  };
}

export function subscribeWs(listener: Listener) {
  listeners.add(listener);
  if (lastOnlineCount !== null) listener({ type: 'online:count', count: lastOnlineCount });
  return () => listeners.delete(listener);
}

export function sendWs(payload: any) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return false;
  ws.send(JSON.stringify(payload));
  return true;
}
