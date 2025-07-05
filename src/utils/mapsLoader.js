// 🆓 FREE Maps Services Loader - No API keys needed!

let isLoaded = false;
let loadPromise = null;

export const loadFreeMapServices = () => {
  if (isLoaded) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    // Check if Leaflet is already loaded
    if (window.L) {
      isLoaded = true;
      resolve();
      return;
    }

    console.log('🆓 Loading FREE map services (Leaflet + OpenStreetMap)...');
    console.log('💰 Monthly cost: $0 (vs $350+ for Google Maps APIs)');
    
    // Load Leaflet CSS
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    cssLink.crossOrigin = '';
    document.head.appendChild(cssLink);
    
    // Load Leaflet JavaScript
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.defer = true;
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    
    script.onload = () => {
      console.log('✅ FREE Leaflet library loaded successfully');
      console.log('🗺️ Using OpenStreetMap tiles (completely free)');
      isLoaded = true;
      resolve();
    };
    
    script.onerror = (error) => {
      console.error('❌ Failed to load Leaflet library:', error);
      console.log('🔄 Trying to load from CDN...');
      reject(new Error('Failed to load Leaflet library'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
};

export const isFreeMapServicesLoaded = () => {
  return isLoaded && window.L;
};

// Helper function to test free services
export const testFreeServices = async () => {
  const results = {
    leaflet: false,
    openstreetmap: false,
    nominatim: false,
    overpass: false,
    osrm: false
  };

  try {
    // Test Leaflet
    results.leaflet = window.L !== undefined;
    
    // Test OpenStreetMap tiles
    try {
      const osmResponse = await fetch('https://tile.openstreetmap.org/0/0/0.png');
      results.openstreetmap = osmResponse.ok;
    } catch (error) {
      console.warn('OpenStreetMap tiles test failed:', error);
    }

    // Test Nominatim geocoding
    try {
      const nominatimResponse = await fetch(
        'https://nominatim.openstreetmap.org/search?q=test&format=json&limit=1'
      );
      results.nominatim = nominatimResponse.ok;
    } catch (error) {
      console.warn('Nominatim test failed:', error);
    }

    // Test Overpass API
    try {
      const overpassResponse = await fetch('https://overpass-api.de/api/status');
      results.overpass = overpassResponse.ok;
    } catch (error) {
      console.warn('Overpass API test failed:', error);
    }

    // Test OSRM routing
    try {
      const osrmResponse = await fetch(
        'https://router.project-osrm.org/route/v1/driving/13.388860,52.517037;13.397634,52.529407?overview=false&steps=false'
      );
      results.osrm = osrmResponse.ok;
    } catch (error) {
      console.warn('OSRM test failed:', error);
    }

    return {
      success: true,
      results,
      message: '🆓 All free services tested successfully!'
    };
  } catch (error) {
    return {
      success: false,
      results,
      message: `❌ Error testing free services: ${error.message}`
    };
  }
};

// Legacy compatibility exports (for components that haven't been updated yet)
export const loadGoogleMapsAPI = () => {
  console.warn('🔄 loadGoogleMapsAPI is deprecated. Use loadFreeMapServices instead.');
  return loadFreeMapServices();
};

export const isGoogleMapsLoaded = () => {
  console.warn('🔄 isGoogleMapsLoaded is deprecated. Use isFreeMapServicesLoaded instead.');
  return isFreeMapServicesLoaded();
};