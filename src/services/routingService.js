// Real Routing Service using OSRM (Open Source Routing Machine)
// Replaces straight-line connections with actual road routing

class RoutingService {
  constructor() {
    this.baseURL = 'https://router.project-osrm.org';
    this.cache = new Map();
    this.requestQueue = [];
    this.isProcessing = false;
  }

  // Rate limiting for free OSRM service
  async queueRequest(request) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ request, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;
    
    this.isProcessing = true;
    while (this.requestQueue.length > 0) {
      const { request, resolve, reject } = this.requestQueue.shift();
      try {
        const result = await request();
        resolve(result);
      } catch (error) {
        reject(error);
      }
      // Rate limiting: 1 request per second for free service
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    this.isProcessing = false;
  }

  // Calculate route between multiple waypoints
  async calculateRoute(waypoints, profile = 'driving') {
    if (waypoints.length < 2) {
      throw new Error('Need at least 2 waypoints for routing');
    }

    return this.queueRequest(async () => {
      try {
        // Convert waypoints to coordinate string
        const coordinates = waypoints.map(point => 
          `${point.longitude},${point.latitude}`
        ).join(';');

        // Map profile to OSRM profile
        const profileMap = {
          'driving': 'driving',
          'walking': 'foot',
          'cycling': 'bike'
        };
        const osrmProfile = profileMap[profile] || 'driving';

        // Create cache key
        const cacheKey = `${osrmProfile}-${coordinates}`;
        if (this.cache.has(cacheKey)) {
          console.log('🗺️ Using cached route');
          return this.cache.get(cacheKey);
        }

        console.log(`🗺️ Calculating ${osrmProfile} route for ${waypoints.length} points`);

        const url = `${this.baseURL}/route/v1/${osrmProfile}/${coordinates}?overview=full&geometries=geojson&steps=true&alternatives=false`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Routing failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
          throw new Error('No route found');
        }

        const route = data.routes[0];
        const result = {
          distance: route.distance, // meters
          duration: route.duration, // seconds
          geometry: route.geometry, // GeoJSON LineString
          steps: this.extractSteps(route.legs),
          waypoints: data.waypoints,
          profile: profile,
          coordinates: this.decodeGeometry(route.geometry)
        };

        // Cache the result
        this.cache.set(cacheKey, result);
        
        console.log(`✅ Route calculated: ${Math.round(result.distance/1000)}km, ${Math.round(result.duration/60)}min`);
        
        return result;

      } catch (error) {
        console.error('Routing error:', error);
        // Return fallback straight-line route
        return this.createFallbackRoute(waypoints, profile);
      }
    });
  }

  // Extract human-readable steps from OSRM legs
  extractSteps(legs) {
    const allSteps = [];
    
    legs.forEach(leg => {
      if (leg.steps) {
        leg.steps.forEach(step => {
          allSteps.push({
            instruction: step.maneuver?.instruction || 'Continue',
            distance: step.distance,
            duration: step.duration,
            name: step.name || '',
            mode: step.mode || 'driving'
          });
        });
      }
    });

    return allSteps;
  }

  // Decode GeoJSON geometry to coordinate array
  decodeGeometry(geometry) {
    if (geometry.type === 'LineString') {
      return geometry.coordinates.map(coord => [coord[1], coord[0]]); // [lat, lng]
    }
    return [];
  }

  // Create fallback route when OSRM fails
  createFallbackRoute(waypoints, profile) {
    console.warn('🚨 Using fallback straight-line route');
    
    const coordinates = waypoints.map(point => [point.latitude, point.longitude]);
    
    // Calculate approximate distance and duration
    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      totalDistance += this.calculateDistance(
        waypoints[i].latitude, waypoints[i].longitude,
        waypoints[i + 1].latitude, waypoints[i + 1].longitude
      );
    }

    // Estimate duration based on profile
    const speeds = {
      'driving': 50, // km/h
      'walking': 5,  // km/h
      'cycling': 15  // km/h
    };
    const speed = speeds[profile] || 50;
    const duration = (totalDistance / 1000) / speed * 3600; // seconds

    return {
      distance: totalDistance,
      duration: duration,
      geometry: {
        type: 'LineString',
        coordinates: waypoints.map(p => [p.longitude, p.latitude])
      },
      coordinates: coordinates,
      steps: [{
        instruction: `${profile === 'walking' ? 'Walk' : profile === 'cycling' ? 'Cycle' : 'Drive'} to destination`,
        distance: totalDistance,
        duration: duration,
        name: 'Direct route',
        mode: profile
      }],
      profile: profile,
      fallback: true
    };
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI/180);
  }

  // Calculate route between consecutive activities
  async calculateDayRoute(activities, profile = 'walking') {
    if (!activities || activities.length < 2) {
      return null;
    }

    const waypoints = activities
      .filter(activity => activity.latitude && activity.longitude)
      .map(activity => ({
        latitude: activity.latitude,
        longitude: activity.longitude,
        name: activity.name
      }));

    if (waypoints.length < 2) {
      return null;
    }

    return await this.calculateRoute(waypoints, profile);
  }

  // Get optimal travel mode based on distance and activity types
  getOptimalTravelMode(activities) {
    if (!activities || activities.length < 2) return 'walking';

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 0; i < activities.length - 1; i++) {
      const current = activities[i];
      const next = activities[i + 1];
      
      if (current.latitude && current.longitude && next.latitude && next.longitude) {
        totalDistance += this.calculateDistance(
          current.latitude, current.longitude,
          next.latitude, next.longitude
        );
      }
    }

    // Recommend travel mode based on distance
    if (totalDistance < 2000) return 'walking';      // < 2km - walk
    if (totalDistance < 10000) return 'cycling';     // < 10km - bike
    return 'driving';                                 // > 10km - drive
  }

  // Clear cache (useful for memory management)
  clearCache() {
    this.cache.clear();
    console.log('🗺️ Route cache cleared');
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessing
    };
  }
}

// Singleton instance
const routingService = new RoutingService();

export default routingService;

// Helper functions for components
export const calculateRoute = (waypoints, profile) => 
  routingService.calculateRoute(waypoints, profile);

export const calculateDayRoute = (activities, profile) => 
  routingService.calculateDayRoute(activities, profile);

export const getOptimalTravelMode = (activities) => 
  routingService.getOptimalTravelMode(activities);

export const clearRouteCache = () => routingService.clearCache(); 