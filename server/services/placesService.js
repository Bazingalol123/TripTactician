import axios from 'axios';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

const MAX_CANDIDATES = 60;
const MIN_RATING = 3.5;
const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';

export const fetchCandidates = async ({ destination, interests, hardAvoidsA, hardAvoidsB }) => {
  if (!env.GOOGLE_PLACES_API_KEY) {
    logger.warn('GOOGLE_PLACES_API_KEY not set — skipping place fetch');
    return [];
  }

  const categories = mapInterestsToPlaceTypes(interests);
  const allResults = [];

  for (const category of categories) {
    try {
      const res = await axios.get(`${PLACES_BASE}/textsearch/json`, {
        params: {
          query: `${category} in ${destination.name}`,
          key: env.GOOGLE_PLACES_API_KEY,
          type: category,
        },
      });
      allResults.push(...(res.data.results || []));
    } catch (err) {
      logger.warn({ err, category }, 'Places search failed for category');
    }
  }

  const filtered = allResults
    .filter((p) => (p.rating || 0) >= MIN_RATING)
    .filter((p) => !matchesAvoids(p, hardAvoidsA))
    .filter((p) => !matchesAvoids(p, hardAvoidsB))
    .slice(0, MAX_CANDIDATES);

  return filtered.map(normalizePlaceResult);
};

const matchesAvoids = (place, hardAvoids) => {
  if (!hardAvoids) return false;
  const avoidWords = hardAvoids.toLowerCase().split(/[,\s]+/);
  const placeText = `${place.name} ${(place.types || []).join(' ')}`.toLowerCase();
  return avoidWords.some((word) => word.length > 2 && placeText.includes(word));
};

const normalizePlaceResult = (place) => ({
  placeId: place.place_id,
  name: place.name,
  coords: {
    lat: place.geometry?.location?.lat,
    lng: place.geometry?.location?.lng,
  },
  category: place.types?.[0] || 'attraction',
  priceLevel: place.price_level ?? null,
  rating: place.rating,
  openingHours: place.opening_hours || null,
  photos: (place.photos || []).slice(0, 3).map((p) => p.photo_reference),
  website: place.website || null,
  reservationsUrl: null,
  viatorProductId: null,
  bookingType: inferBookingType(place.types),
});

const inferBookingType = (types = []) => {
  if (types.some((t) => ['restaurant', 'cafe', 'bar', 'food'].includes(t))) return 'restaurant';
  if (types.some((t) => ['tourist_attraction', 'museum', 'park', 'amusement_park'].includes(t)))
    return 'experience';
  if (types.some((t) => ['church', 'place_of_worship', 'natural_feature'].includes(t)))
    return 'attraction';
  return 'none';
};

const mapInterestsToPlaceTypes = (interests) => {
  const map = {
    food: ['restaurant', 'cafe', 'bakery'],
    culture: ['museum', 'art_gallery', 'church'],
    nature: ['park', 'natural_feature'],
    nightlife: ['bar', 'night_club'],
    shopping: ['shopping_mall', 'store'],
    adventure: ['amusement_park', 'tourist_attraction'],
    wellness: ['spa', 'gym'],
  };
  return [...new Set((interests || []).flatMap((i) => map[i] || []))];
};
