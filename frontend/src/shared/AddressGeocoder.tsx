import { useEffect, useRef, useState } from 'react';
import { Card, Flex, Text, TextField } from '@radix-ui/themes';

type Suggestion = {
  id: string;
  label: string;
  shortLabel: string;
  latitude: number;
  longitude: number;
  city?: string;
};

type Props = {
  value: string;
  city: string;
  placeholder?: string;
  onChange: (next: string) => void;
  onSelect: (next: { address: string; city: string; latitude: number; longitude: number }) => void;
};

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;

function normalizeCity(address: Record<string, any>): string {
  return (
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.municipality ||
    address.county ||
    address.state ||
    ''
  );
}

function buildShortAddress(item: any): string {
  const address = item.address || {};
  const components = [
    address.road,
    address.house_number,
    address.pedestrian,
    address.neighbourhood,
    address.suburb,
    address.city_district,
  ].filter(Boolean);
  if (components.length > 0) {
    return components.join(', ');
  }
  return item.display_name || '';
}

function getDropdownStyle() {
  return {
    position: 'absolute' as const,
    zIndex: 10000,
    width: '100%',
    top: 'calc(100% + 8px)',
    left: 0,
    maxHeight: 340,
    overflowY: 'auto' as const,
    padding: 'var(--space-2)',
    borderRadius: 'var(--radius-4)',
    boxShadow: '0 18px 40px rgba(0,0,0,0.14)',
    background: 'white',
  };
}

export function AddressGeocoder({ value, city, placeholder, onChange, onSelect }: Props) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const blurTimeout = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    if (query.trim().length < MIN_QUERY_LENGTH) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setSuggestions([]);
      setLoading(false);
      setError(null);
      setOpen(false);
      return;
    }

    setOpen(true);
    setLoading(true);
    setError(null);
    setSuggestions([]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeoutId = window.setTimeout(() => {
      fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&accept-language=ru&q=${encodeURIComponent(
          query,
        )}`,
        {
          headers: {
            Accept: 'application/json',
          },
          signal: controller.signal,
        },
      )
        .then(async (response) => {
          if (!response.ok) {
            throw new Error('Ошибка сети');
          }
          return response.json();
        })
        .then((data) => {
          const next = Array.isArray(data)
            ? data.map((item: any) => ({
                id: String(item.place_id),
                label: item.display_name,
                shortLabel: buildShortAddress(item),
                latitude: Number(item.lat),
                longitude: Number(item.lon),
                city: normalizeCity(item.address || {}),
              }))
            : [];
          setSuggestions(next);
        })
        .catch((error) => {
          if (error.name === 'AbortError') return;
          setError('Не удалось получить подсказки адреса');
          setSuggestions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  function handleSelect(item: Suggestion) {
    setQuery(item.shortLabel || item.label);
    setSuggestions([]);
    setOpen(false);
    onSelect({
      address: item.shortLabel || item.label,
      city: item.city || city,
      latitude: item.latitude,
      longitude: item.longitude,
    });
  }

  return (
    <div style={{ position: 'relative', zIndex: 1000 }}>
      <TextField.Root
        type="text"
        placeholder={placeholder}
        value={query}
        autoComplete="off"
        style={{ minHeight: 52 }}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          onChange(next);
          setOpen(next.trim().length >= MIN_QUERY_LENGTH);
        }}
        onFocus={() => {
          if (query.trim().length >= MIN_QUERY_LENGTH) {
            setOpen(true);
          }
        }}
        onBlur={() => {
          blurTimeout.current = window.setTimeout(() => {
            setOpen(false);
          }, 150);
        }}
      />

      {open && (suggestions.length > 0 || loading || error) && (
        <Card
          variant="surface"
          style={getDropdownStyle()}
          onMouseDown={(event) => {
            event.preventDefault();
            if (blurTimeout.current) {
              window.clearTimeout(blurTimeout.current);
              blurTimeout.current = null;
            }
          }}
        >
          {loading && (
            <Flex align="center" gap="2" style={{ padding: 'var(--space-2)' }}>
              <Text size="2" color="gray">Поиск адресов...</Text>
            </Flex>
          )}

          {error && !loading && (
            <Text size="2" color="red" style={{ padding: 'var(--space-2)' }}>
              {error}
            </Text>
          )}

          {!loading && !error && suggestions.length === 0 && query.trim().length >= MIN_QUERY_LENGTH && (
            <Text size="2" color="gray" style={{ padding: 'var(--space-2)' }}>
              Ничего не найдено
            </Text>
          )}

          {!loading && suggestions.map((item) => (
            <Card
              key={item.id}
              variant="surface"
              style={{
                cursor: 'pointer',
                padding: 'var(--space-2)',
                marginBottom: '4px',
                transition: 'background 0.2s ease',
              }}
              onMouseDown={(event) => {
                event.preventDefault();
                handleSelect(item);
              }}
              onMouseEnter={(event) => {
                (event.currentTarget as HTMLElement).style.background = 'var(--gray-2)';
              }}
              onMouseLeave={(event) => {
                (event.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <Text size="2" weight="medium">{item.shortLabel || item.label}</Text>
              <Text size="1" color="gray" as="div">
                {item.label}
              </Text>
              {item.city && <Text size="1" color="gray">{item.city}</Text>}
            </Card>
          ))}
        </Card>
      )}
    </div>
  );
}
