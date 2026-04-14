import { useState, useCallback } from 'react';
import { TextField, Flex, Grid, Text, Spinner } from '@radix-ui/themes';
import { api } from '../api/axios';
import AdCard, { type AdCardData } from '../components/ads/AdCard';
import { SearchIcon } from '../components/common/Icons';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AdCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const searchAds = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await api.get('/ads', {
        params: { q: searchQuery, take: 20, skip: 0 },
      });
      setResults(response.data || []);
    } catch (err) {
      setError('Ошибка при поиске объявлений');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    const timer = setTimeout(() => {
      searchAds(value);
    }, 300);
    return () => clearTimeout(timer);
  };

  return (
    <Flex direction="column" gap="4" p="4">
      <Flex align="center" gap="2">
        <SearchIcon />
        <Text size="4" weight="bold">
          Поиск объявлений
        </Text>
      </Flex>

      <TextField.Root
        placeholder="Введите минимум 2 символа для поиска..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        size="3"
      />

      {loading && (
        <Flex justify="center" align="center" gap="2" p="4">
          <Spinner />
          <Text>Поиск...</Text>
        </Flex>
      )}

      {error && <Text color="red">{error}</Text>}

      {searched && !loading && results.length === 0 && (
        <Text color="gray">Объявления не найдены</Text>
      )}

      {results.length > 0 && (
        <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
          {results.map((ad) => (
            <AdCard key={ad.id} ad={ad} showDescription />
          ))}
        </Grid>
      )}

      {!searched && !loading && (
        <Flex justify="center" align="center" p="4">
          <Text color="gray" align="center">
            Начните вводить название, описание или тип для поиска объявлений
          </Text>
        </Flex>
      )}
    </Flex>
  );
}
