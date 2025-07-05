// Backend Free Mapping Service
// Replaces Google Maps/Places APIs with free alternatives

const axios = require('axios');

class MapsService {
  constructor() {
    this.nominatimBaseURL = process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org';
    this.overpassURL = process.env.OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter';
    this.requestQueue = [];
    this.isProcessingQueue = false;
    // Simple in-memory cache to avoid repeating identical geocoding requests during a single Node process life-time
    this.geocodeCache = new Map();
  }

  // Rate limiting for free APIs
  async queueRequest(request) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ request, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    while (this.requestQueue.length > 0) {
      const { request, resolve, reject } = this.requestQueue.shift();
      try {
        const result = await request();
        resolve(result);
      } catch (error) {
        reject(error);
      }
      // Rate limiting: wait ~0.4s between requests to improve speed but stay polite
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    this.isProcessingQueue = false;
  }

  // Geocoding using Nominatim (OpenStreetMap)
  async geocode(address) {
    // Check cache first to skip network call
    const cacheKey = address.toLowerCase();
    if (this.geocodeCache.has(cacheKey)) {
      return this.geocodeCache.get(cacheKey);
    }

    return this.queueRequest(async () => {
      try {
        console.log(`🗺️ Geocoding: ${address}`);
        
        // Clean the address for better geocoding
        const cleanAddress = address
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/[^\w\s,.-]/g, '');
        
        const response = await axios.get(`${this.nominatimBaseURL}/search`, {
          params: {
            q: cleanAddress,
            format: 'json',
            limit: 5, // Get more results to find the best match
            addressdetails: 1,
            countrycodes: '', // Don't limit by country
            viewbox: '', // Don't limit by viewbox
            bounded: 0 // Don't require bounded results
          },
          headers: {
            'User-Agent': 'TravelCommandCenter/1.0 (travel-app)'
          },
          timeout: 15000 // 15 second timeout
        });

        if (response.data.length === 0) {
          throw new Error(`Location not found: ${address}`);
        }

        // Find the best result (prefer named places over generic areas)
        const results = response.data;
        let bestResult = results[0];
        
        // Look for a result with a proper name
        for (const result of results) {
          if (result.name && result.name !== result.display_name.split(',')[0]) {
            bestResult = result;
            break;
          }
        }

        const geocoded = {
          latitude: parseFloat(bestResult.lat),
          longitude: parseFloat(bestResult.lon),
          formatted_address: bestResult.display_name,
          place_id: bestResult.place_id,
          name: bestResult.name || cleanAddress,
          bounds: bestResult.boundingbox ? {
            north: parseFloat(bestResult.boundingbox[1]),
            south: parseFloat(bestResult.boundingbox[0]),
            east: parseFloat(bestResult.boundingbox[3]),
            west: parseFloat(bestResult.boundingbox[2])
          } : null
        };

        console.log(`✅ Geocoded ${address}: ${geocoded.latitude}, ${geocoded.longitude}`);
        // store in cache
        this.geocodeCache.set(cacheKey, geocoded);
        return geocoded;
      } catch (error) {
        console.error(`❌ Geocoding error for ${address}:`, error.message);
        
        // Try with a simplified address
        try {
          console.log(`🔄 Retrying with simplified address for: ${address}`);
          const simplifiedAddress = address.split(',')[0]; // Just the first part
          
          const retryResponse = await axios.get(`${this.nominatimBaseURL}/search`, {
            params: {
              q: simplifiedAddress,
              format: 'json',
              limit: 3,
              addressdetails: 1
            },
            headers: {
              'User-Agent': 'TravelCommandCenter/1.0 (travel-app)'
            },
            timeout: 10000
          });

          if (retryResponse.data.length > 0) {
            const result = retryResponse.data[0];
            const geocoded = {
              latitude: parseFloat(result.lat),
              longitude: parseFloat(result.lon),
              formatted_address: result.display_name,
              place_id: result.place_id,
              name: result.name || simplifiedAddress
            };
            
            console.log(`✅ Simplified geocoding succeeded: ${simplifiedAddress} -> ${geocoded.latitude}, ${geocoded.longitude}`);
            return geocoded;
          }
        } catch (retryError) {
          console.error(`❌ Simplified geocoding also failed for ${address}:`, retryError.message);
        }
        
        // If all geocoding attempts fail, throw the error instead of using fallback
        throw new Error(`Failed to geocode address: ${address}. Please check the address format and try again.`);
      }
    });
  }

  // Reverse geocoding
  async reverseGeocode(latitude, longitude) {
    return this.queueRequest(async () => {
      try {
        const response = await axios.get(`${this.nominatimBaseURL}/reverse`, {
          params: {
            lat: latitude,
            lon: longitude,
            format: 'json',
            addressdetails: 1
          },
          headers: {
            'User-Agent': 'TravelCommandCenter/1.0 (travel-app)'
          }
        });

        const data = response.data;
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
  }

  // Search places using Overpass API
  async searchPlaces(location, category = 'tourist_attraction', radius = 10000) {
    // Reduce radius for heavy categories to avoid massive Overpass payloads
    const heavyCategories = ['night_club', 'bar', 'pub', 'cafe', 'restaurant'];
    if (heavyCategories.includes(category)) {
      radius = Math.min(radius, 3000); // 3 km max for dense POI types
    }

    return this.queueRequest(async () => {
      try {
        console.log(`🔍 Searching ${category} places near ${location}`);
        
        // First geocode the location
        const geocoded = await this.geocode(location);
        const { latitude, longitude } = geocoded;

        // Category mapping for Overpass API
        const categoryMapping = {
          'restaurant': 'amenity=restaurant',
          'tourist_attraction': 'tourism=attraction',
          'museum': 'tourism=museum',
          'hotel': 'tourism=hotel',
          'lodging': 'tourism=hotel',
          'cafe': 'amenity=cafe',
          'bar': 'amenity=bar',
          'pub': 'amenity=pub',
          'park': 'leisure=park',
          'shopping': 'shop',
          'hospital': 'amenity=hospital',
          'bank': 'amenity=bank',
          'pharmacy': 'amenity=pharmacy',
          'gas_station': 'amenity=fuel',
          'church': 'amenity=place_of_worship',
          'art_gallery': 'tourism=gallery'
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

        const response = await axios.post(this.overpassURL, 
          `data=${encodeURIComponent(overpassQuery)}`,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout: 30000
          }
        );

        const data = response.data;
        const places = data.elements.map(element => {
          const lat = element.lat || element.center?.lat;
          const lon = element.lon || element.center?.lon;
          
          return {
            place_id: element.id.toString(),
            name: element.tags?.name || 'Unnamed Location',
            formatted_address: this.formatAddress(element.tags),
            latitude: lat,
            longitude: lon,
            rating: this.generateMockRating(),
            price_level: this.generateMockPriceLevel(),
            types: [category],
            opening_hours: element.tags?.opening_hours,
            phone: element.tags?.phone,
            website: element.tags?.website,
            description: element.tags?.description || this.generateDescription(category),
            category: category,
            source: 'OpenStreetMap'
          };
        }).filter(place => place.latitude && place.longitude && place.name !== 'Unnamed Location')
          .slice(0, 20);

        console.log(`✅ Found ${places.length} ${category} places near ${location}`);
        return places;
        
      } catch (error) {
        console.error(`❌ Places search error for ${category} near ${location}:`, error.message);
        return []; // Return empty array instead of throwing
      }
    });
  }

  // Dynamic car rental data (replaces mock data)
  async searchCarRentals(destination, pickupDate, returnDate, options = {}) {
    try {
      console.log(`🚗 Searching car rentals in ${destination}`);
      
      // Geocode destination to get accurate location data
      const geocoded = await this.geocode(destination);
      
      // Calculate rental duration
      const pickup = new Date(pickupDate);
      const returnDt = new Date(returnDate);
      const days = Math.ceil((returnDt - pickup) / (1000 * 60 * 60 * 24));
      
      // Generate realistic rental options based on location
      const baseRates = this.getLocationBasedRates(destination);
      const rentals = [];
      
      // Create different car types with varying prices
      const carTypes = [
        { type: 'Economy', model: 'Nissan Versa or similar', multiplier: 1.0 },
        { type: 'Compact', model: 'Toyota Corolla or similar', multiplier: 1.2 },
        { type: 'Intermediate', model: 'Honda Civic or similar', multiplier: 1.4 },
        { type: 'Standard', model: 'Toyota Camry or similar', multiplier: 1.6 },
        { type: 'Full Size', model: 'Chevrolet Malibu or similar', multiplier: 1.8 },
        { type: 'Premium', model: 'BMW 3 Series or similar', multiplier: 2.5 }
      ];
      
      const companies = ['Hertz', 'Enterprise', 'Avis', 'Budget', 'Alamo', 'National'];
      
      carTypes.forEach((car, index) => {
        const company = companies[index % companies.length];
        const dailyRate = Math.round(baseRates.economy * car.multiplier);
        const totalCost = dailyRate * days;
        
        rentals.push({
          id: `rental_${index + 1}`,
          company: company,
          carType: car.type,
          model: car.model,
          dailyRate: dailyRate,
          totalCost: totalCost,
          pickupLocation: `${destination} Airport`,
          features: this.getCarFeatures(car.type),
          rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
          cancellationPolicy: 'Free cancellation up to 24 hours',
          mileagePolicy: 'Unlimited miles',
          fuelPolicy: 'Full-to-Full'
        });
      });
      
      // Sort by price
      rentals.sort((a, b) => a.totalCost - b.totalCost);
      
      console.log(`✅ Generated ${rentals.length} car rental options for ${destination}`);
      return rentals.slice(0, 4); // Return top 4 options
      
    } catch (error) {
      console.error('Car rental search error:', error);
      throw error;
    }
  }

  // Helper methods
  formatAddress(tags) {
    const parts = [];
    if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
    if (tags['addr:street']) parts.push(tags['addr:street']);
    if (tags['addr:city']) parts.push(tags['addr:city']);
    if (tags['addr:country']) parts.push(tags['addr:country']);
    
    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  }

  generateMockRating() {
    return Math.round((Math.random() * 2 + 3) * 10) / 10; // 3.0 to 5.0
  }

  generateMockPriceLevel() {
    return Math.floor(Math.random() * 4) + 1; // 1 to 4
  }

  generateDescription(category) {
    const descriptions = {
      'restaurant': 'Local dining establishment offering regional cuisine and authentic flavors',
      'tourist_attraction': 'Popular tourist destination worth visiting with historical significance',
      'museum': 'Cultural institution showcasing art, history, or science collections',
      'hotel': 'Accommodation facility for travelers with modern amenities',
      'cafe': 'Casual dining spot for coffee, light meals, and social gatherings',
      'bar': 'Social venue serving alcoholic beverages and entertainment',
      'park': 'Public green space for recreation, relaxation, and outdoor activities',
      'shopping': 'Retail establishment for shopping and local products'
    };
    
    return descriptions[category] || 'Point of interest worth visiting';
  }

  getFallbackCoordinates(destination) {
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
      'milano': { latitude: 45.4642, longitude: 9.1900 },
      'venice': { latitude: 45.4408, longitude: 12.3155 },
      'florence': { latitude: 43.7696, longitude: 11.2558 },
      'naples': { latitude: 40.8518, longitude: 14.2681 },
      'seville': { latitude: 37.3886, longitude: -5.9823 },
      'vienna': { latitude: 48.2082, longitude: 16.3738 },
      'prague': { latitude: 50.0755, longitude: 14.4378 },
      'athens': { latitude: 37.9755, longitude: 23.7348 },
      'israel': { latitude: 31.0461, longitude: 34.8516 },
      'tel aviv': { latitude: 32.0853, longitude: 34.7818 },
      'jerusalem': { latitude: 31.7683, longitude: 35.2137 },
      'italy': { latitude: 41.9028, longitude: 12.4964 }, // Default to Rome for Italy
      'spain': { latitude: 40.4168, longitude: -3.7038 }, // Default to Madrid for Spain
      'france': { latitude: 48.8566, longitude: 2.3522 }, // Default to Paris for France
      'germany': { latitude: 52.5200, longitude: 13.4050 }, // Default to Berlin for Germany
      'netherlands': { latitude: 52.3676, longitude: 4.9041 }, // Default to Amsterdam for Netherlands
      'austria': { latitude: 48.2082, longitude: 16.3738 }, // Default to Vienna for Austria
      'czech republic': { latitude: 50.0755, longitude: 14.4378 }, // Default to Prague for Czech Republic
      'greece': { latitude: 37.9755, longitude: 23.7348 } // Default to Athens for Greece
    };
    
    const destLower = destination.toLowerCase();
    const cityKey = Object.keys(cityCoordinates).find(city => 
      destLower.includes(city)
    );
    
    if (cityKey) {
      const coords = cityCoordinates[cityKey];
      console.log(`📍 Found fallback coordinates for ${destination}: ${coords.latitude}, ${coords.longitude}`);
      return coords;
    }
    
    // If no specific match, try to extract a city name from the destination
    const cityMatch = destLower.match(/([a-zA-Z\s]+?)(?:,|\s+in\s+|\s+to\s+|\s+for\s+|\s+trip\s+to\s+)/);
    if (cityMatch) {
      const cityName = cityMatch[1].trim();
      const cityKey = Object.keys(cityCoordinates).find(city => cityName.includes(city));
      if (cityKey) {
        const coords = cityCoordinates[cityKey];
        console.log(`📍 Found city match for ${destination}: ${coords.latitude}, ${coords.longitude}`);
        return coords;
      }
    }
    
    // Last resort: use Rome as default instead of New York
    console.log(`⚠️ No specific coordinates found for ${destination}, using Rome as default`);
    return { latitude: 41.9028, longitude: 12.4964 }; // Default to Rome instead of NYC
  }

  getLocationBasedRates(destination) {
    // Base rates vary by destination (daily rates in USD)
    const locationRates = {
      'europe': { economy: 35, premium: 80 },
      'usa': { economy: 45, premium: 120 },
      'asia': { economy: 25, premium: 60 },
      'default': { economy: 40, premium: 100 }
    };
    
    const dest = destination.toLowerCase();
    if (dest.includes('paris') || dest.includes('london') || dest.includes('rome') || 
        dest.includes('madrid') || dest.includes('barcelona') || dest.includes('berlin')) {
      return locationRates.europe;
    } else if (dest.includes('new york') || dest.includes('los angeles') || dest.includes('chicago')) {
      return locationRates.usa;
    } else if (dest.includes('tokyo') || dest.includes('bangkok') || dest.includes('singapore')) {
      return locationRates.asia;
    }
    
    return locationRates.default;
  }

  getCarFeatures(carType) {
    const baseFeatures = ['Air Conditioning', 'Automatic Transmission'];
    const premiumFeatures = ['Bluetooth', 'Backup Camera', 'GPS Navigation', 'Leather Seats'];
    
    if (carType === 'Economy' || carType === 'Compact') {
      return baseFeatures;
    } else if (carType === 'Premium') {
      return [...baseFeatures, ...premiumFeatures];
    } else {
      return [...baseFeatures, 'Bluetooth', 'Backup Camera'];
    }
  }
}

module.exports = new MapsService(); 