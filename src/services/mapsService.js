// Free OpenStreetMap-based mapping service
// Replaces Google Maps API with free alternatives

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

// Rate limiting for free APIs
const requestQueue = [];
let isProcessingQueue = false;

const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  while (requestQueue.length > 0) {
    const { request, resolve, reject } = requestQueue.shift();
    try {
      const result = await request();
      resolve(result);
    } catch (error) {
      reject(error);
    }
    // Rate limiting: wait 1 second between requests to respect free APIs
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  isProcessingQueue = false;
};

const queueRequest = (request) => {
  return new Promise((resolve, reject) => {
    requestQueue.push({ request, resolve, reject });
    processQueue();
  });
};

// Geocoding service using Nominatim (free OpenStreetMap geocoding)
export const geocodeLocation = async (address) => {
  return queueRequest(async () => {
    try {
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `${NOMINATIM_BASE_URL}/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'TravelCommandCenter/1.0 (travel-app)'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.length === 0) {
        throw new Error('Location not found');
      }

      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        formatted_address: result.display_name,
        place_id: result.place_id,
        bounds: result.boundingbox ? {
          north: parseFloat(result.boundingbox[1]),
          south: parseFloat(result.boundingbox[0]),
          east: parseFloat(result.boundingbox[3]),
          west: parseFloat(result.boundingbox[2])
        } : null
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  });
};

// Reverse geocoding
export const reverseGeocode = async (latitude, longitude) => {
  return queueRequest(async () => {
    try {
      const response = await fetch(
        `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'TravelCommandCenter/1.0 (travel-app)'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        formatted_address: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village,
        country: data.address?.country,
        postal_code: data.address?.postcode
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw error;
    }
  });
};

// Search for places using Overpass API (OpenStreetMap POI data)
export const searchPlaces = async (location, category = 'tourist_attraction', radius = 10000) => {
  return queueRequest(async () => {
    try {
      // First geocode the location
      const geocoded = await geocodeLocation(location);
      const { latitude, longitude } = geocoded;

      // Map categories to Overpass API tags
      const categoryMapping = {
        'restaurant': 'amenity=restaurant',
        'tourist_attraction': 'tourism=attraction',
        'museum': 'tourism=museum',
        'hotel': 'tourism=hotel',
        'cafe': 'amenity=cafe',
        'bar': 'amenity=bar',
        'park': 'leisure=park',
        'shop': 'shop',
        'hospital': 'amenity=hospital',
        'bank': 'amenity=bank',
        'pharmacy': 'amenity=pharmacy',
        'gas_station': 'amenity=fuel'
      };

      const overpassTag = categoryMapping[category] || 'tourism=attraction';
      
      // Overpass API query
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node[${overpassTag}](around:${radius},${latitude},${longitude});
          way[${overpassTag}](around:${radius},${latitude},${longitude});
          relation[${overpassTag}](around:${radius},${latitude},${longitude});
        );
        out center tags;
      `;

      const response = await fetch(OVERPASS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(overpassQuery)}`
      });

      if (!response.ok) {
        throw new Error(`Overpass API failed: ${response.status}`);
      }

      const data = await response.json();
      
      return data.elements.map(element => {
        const lat = element.lat || element.center?.lat;
        const lon = element.lon || element.center?.lon;
        
        return {
          place_id: element.id.toString(),
          name: element.tags?.name || 'Unnamed Location',
          formatted_address: formatAddress(element.tags),
          latitude: lat,
          longitude: lon,
          rating: generateMockRating(), // OSM doesn't have ratings
          price_level: generateMockPriceLevel(),
          types: [category],
          opening_hours: element.tags?.opening_hours,
          phone: element.tags?.phone,
          website: element.tags?.website,
          description: element.tags?.description || generateDescription(category),
          category: category,
          source: 'OpenStreetMap'
        };
      }).filter(place => place.latitude && place.longitude)
        .slice(0, 20); // Limit results
        
    } catch (error) {
      console.error('Places search error:', error);
      throw error;
    }
  });
};

// Get route between points using OSRM (free routing service)
export const getRoute = async (origin, destination, travelMode = 'driving') => {
  try {
    const modeMapping = {
      'driving': 'driving',
      'walking': 'foot',
      'cycling': 'bike'
    };
    
    const osrmMode = modeMapping[travelMode] || 'driving';
    
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/${osrmMode}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`
    );

    if (!response.ok) {
      throw new Error(`Routing failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry,
        steps: route.legs[0]?.steps || []
      };
    }
    
    throw new Error('No route found');
  } catch (error) {
    console.error('Routing error:', error);
    throw error;
  }
};

// Helper functions
const formatAddress = (tags) => {
  const parts = [];
  if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
  if (tags['addr:street']) parts.push(tags['addr:street']);
  if (tags['addr:city']) parts.push(tags['addr:city']);
  if (tags['addr:country']) parts.push(tags['addr:country']);
  
  return parts.length > 0 ? parts.join(', ') : 'Address not available';
};

const generateMockRating = () => {
  return Math.round((Math.random() * 2 + 3) * 10) / 10; // 3.0 to 5.0
};

const generateMockPriceLevel = () => {
  return Math.floor(Math.random() * 4) + 1; // 1 to 4
};

const generateDescription = (category) => {
  const descriptions = {
    'restaurant': 'Local dining establishment offering regional cuisine',
    'tourist_attraction': 'Popular tourist destination worth visiting',
    'museum': 'Cultural institution showcasing art, history, or science',
    'hotel': 'Accommodation facility for travelers',
    'cafe': 'Casual dining spot for coffee and light meals',
    'bar': 'Social venue serving alcoholic beverages',
    'park': 'Public green space for recreation and relaxation',
    'shop': 'Retail establishment for shopping'
  };
  
  return descriptions[category] || 'Point of interest';
};

// Fallback coordinates for major cities (when geocoding fails)
export const getFallbackCoordinates = (destination) => {
  const cityCoordinates = {
    'paris': { latitude: 48.8566, longitude: 2.3522 },
    'london': { latitude: 51.5074, longitude: -0.1278 },
    'new york': { latitude: 40.7128, longitude: -74.0060 },
    'tokyo': { latitude: 35.6762, longitude: 139.6503 },
    'rome': { latitude: 41.9028, longitude: 12.4964 },
    'barcelona': { latitude: 41.3851, longitude: 2.1734 },
    'amsterdam': { latitude: 52.3676, longitude: 4.9041 },
    'berlin': { latitude: 52.5200, longitude: 13.4050 },
    'madrid': { latitude: 40.4168, longitude: -3.7038 },
    'milan': { latitude: 45.4642, longitude: 9.1900 },
    'milano': { latitude: 45.4642, longitude: 9.1900 }
  };
  
  const destLower = destination.toLowerCase();
  const cityKey = Object.keys(cityCoordinates).find(city => 
    destLower.includes(city)
  );
  
  return cityKey ? cityCoordinates[cityKey] : { latitude: 40.7128, longitude: -74.0060 };
}; 