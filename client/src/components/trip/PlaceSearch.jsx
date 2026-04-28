import { usePlaceSearch } from '../../hooks/usePlaceSearch.js';
import Input from '../ui/Input.jsx';
import PlaceSearchResult from './PlaceSearchResult.jsx';

export default function PlaceSearch({ tripId, onSelect }) {
  const { query, setQuery, results, isSearching } = usePlaceSearch(tripId);

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Search places, restaurants, attractions…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {isSearching && <p className="text-sm text-gray-400">Searching…</p>}
      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map((place) => (
            <PlaceSearchResult key={place.placeId} place={place} onSelect={() => onSelect?.(place)} />
          ))}
        </div>
      )}
      {!isSearching && query.length > 2 && results.length === 0 && (
        <p className="text-sm text-gray-400">No results found</p>
      )}
    </div>
  );
}
