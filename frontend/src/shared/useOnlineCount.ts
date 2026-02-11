import { useEffect, useState } from 'react';
import { subscribeWs } from './wsClient';

export function useOnlineCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsub = subscribeWs((msg) => {
      if (msg?.type === 'online:count') setCount(Number(msg.count || 0));
    });
    return unsub;
  }, []);

  return count;
}
