import { useEffect, useState } from 'react';

export type LatLng = { lat: number; lng: number };

type State =
  | { status: 'idle'; center: null }
  | { status: 'loading'; center: null }
  | { status: 'ready'; center: LatLng }
  | { status: 'error'; center: null };

export function useGeolocationCenter(options?: { timeoutMs?: number }) {
  const timeoutMs = options?.timeoutMs ?? 2500;
  const [state, setState] = useState<State>({ status: 'idle', center: null });

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setState({ status: 'error', center: null });
      return;
    }

    let cancelled = false;
    setState({ status: 'loading', center: null });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setState({
          status: 'ready',
          center: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        });
      },
      () => {
        if (cancelled) return;
        setState({ status: 'error', center: null });
      },
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 60_000 },
    );

    return () => {
      cancelled = true;
    };
  }, [timeoutMs]);

  return state;
}

