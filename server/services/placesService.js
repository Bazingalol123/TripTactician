import axios from 'axios';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

const MAX_CANDIDATES = 60;
const FSQ_BASE = 'https://places-api.foursquare.com';

const FSQ_HEADERS = () => ({
  'Authorization': `Bearer ${env.FOURSQUARE_API_KEY}`,
  'X-Places-Api-Version': '2025-06-17',
  'Accept': 'application/json',
});

const INTEREST_QUERIES = {
  food:      'restaurants',
  culture:   'museums art galleries',
  nature:    'parks',
  nightlife: 'bars nightlife',
  shopping:  'shopping',
  adventure: 'tourist attractions',
  wellness:  'spa wellness',
};

export const fetchCandidates = async ({ destination, interests, hardAvoidsA, hardAvoidsB }) => {
  if (!env.FOURSQUARE_API_KEY) {
    logger.warn('FOURSQUARE_API_KEY not set — skipping place fetch');
    return [];
  }

  const queries = [...new Set((interests || []).map((i) => INTEREST_QUERIES[i]).filter(Boolean))];

  const results = await Promise.all(
    queries.map(async (query) => {
      try {
        const res = await axios.get(`${FSQ_BASE}/places/search`, {
          headers: FSQ_HEADERS(),
          params: {
            near: destination.name,
            query,
            limit: 10,
            fields: 'fsq_place_id,name,location,categories,hours,price,rating,stats,photos,website,description,tips',
          },
        });
        return res.data.results || [];
      } catch (err) {
        logger.warn({ err, query }, 'Foursquare search failed for query');
        return [];
      }
    })
  );

  const seen = new Set();
  const unique = results.flat().filter((p) => {
    if (seen.has(p.fsq_place_id)) return false;
    seen.add(p.fsq_place_id);
    return true;
  });

  const filtered = unique
    .filter((p) => !p.rating || p.rating >= 7.0)
    .filter((p) => !matchesAvoids(p, hardAvoidsA))
    .filter((p) => !matchesAvoids(p, hardAvoidsB))
    .slice(0, MAX_CANDIDATES);

  return filtered.map(normalizePlaceResult);
};

const matchesAvoids = (place, hardAvoids) => {
  if (!hardAvoids) return false;
  const avoidWords = hardAvoids.toLowerCase().split(/[,\s]+/);
  const placeText = place.name.toLowerCase();
  return avoidWords.some((word) => word.length > 2 && placeText.includes(word));
};

const normalizePlaceResult = (place) => ({
  placeId:      place.fsq_place_id,
  name:         place.name,
  coords: {
    lat: place.location?.lat ?? place.location?.latitude,
    lng: place.location?.lng ?? place.location?.longitude,
  },
  category:     place.categories?.[0]?.name || 'attraction',
  priceLevel:   place.price ?? null,
  rating:       place.rating ? place.rating / 2 : null,
  openingHours: place.hours ?? null,
  photos:       (place.photos || [])
                  .slice(0, 3)
                  .map((p) => `${p.prefix}original${p.suffix}`),
  website:      place.website || null,
  reservationsUrl:  null,
  viatorProductId:  null,
  bookingType:  inferBookingType(place.categories),
});

const inferBookingType = (categories = []) => {
  const names = categories.map((c) => (c.name || '').toLowerCase()).join(' ');
  if (['restaurant', 'cafe', 'bar', 'food'].some((k) => names.includes(k))) return 'restaurant';
  if (['museum', 'park', 'attraction', 'gallery'].some((k) => names.includes(k))) return 'experience';
  if (['church', 'temple', 'nature'].some((k) => names.includes(k))) return 'attraction';
  return 'none';
};

export const fetchDestinationPhoto = async (placeId) => {
  if (!env.FOURSQUARE_API_KEY) return null;
  try {
    const res = await axios.get(`${FSQ_BASE}/places/${placeId}`, {
      headers: FSQ_HEADERS(),
      params: { fields: 'photos' },
    });
    const photo = res.data?.photos?.[0];
    if (!photo) return null;
    return `${photo.prefix}original${photo.suffix}`;
  } catch (err) {
    logger.warn({ err, placeId }, 'fetchDestinationPhoto failed');
    return null;
  }
};
