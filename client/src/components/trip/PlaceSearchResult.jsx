import Button from '../ui/Button.jsx';
import { formatPriceLevel } from '../../utils/currency.js';

export default function PlaceSearchResult({ place, onSelect }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white">
      {place.photos?.[0] && (
        <img
          src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=60&photo_reference=${place.photos[0]}&key=`}
          alt=""
          className="w-14 h-14 rounded-lg object-cover bg-gray-100 shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900 truncate">{place.name}</p>
        <p className="text-xs text-gray-500">
          {place.category} · {formatPriceLevel(place.priceLevel)}
          {place.rating ? ` · ${place.rating}★` : ''}
        </p>
      </div>
      <Button variant="secondary" size="sm" onClick={onSelect}>Add</Button>
    </div>
  );
}
