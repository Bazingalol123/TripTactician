import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchPlaces } from '../services/placeService.js';
import { queryKeys } from '../constants/queryKeys.js';

export const usePlaceSearch = (tripId) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ timeOfDay: null, maxPriceLevel: null });
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const search = useQuery({
    queryKey: queryKeys.places.search(tripId, { query: debouncedQuery, ...filters }),
    queryFn: () => searchPlaces(tripId, { query: debouncedQuery, ...filters }),
    enabled: !!tripId && debouncedQuery.length > 2,
  });

  const handleQueryChange = useCallback(
    (value) => {
      setQuery(value);
      clearTimeout(handleQueryChange._timer);
      handleQueryChange._timer = setTimeout(() => setDebouncedQuery(value), 400);
    },
    []
  );

  return {
    query,
    setQuery: handleQueryChange,
    filters,
    setFilters,
    results: search.data ?? [],
    isSearching: search.isFetching,
  };
};
