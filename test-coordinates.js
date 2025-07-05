// Test coordinate extraction logic
function testCoordinateExtraction() {
  console.log('🧪 Testing coordinate extraction logic...\n');

  // Test case 1: Direct values (like from database)
  const place1 = {
    name: 'Test Place 1',
    geometry: {
      location: {
        lat: 48.8584,
        lng: 2.2945
      }
    }
  };

  // Test case 2: Function values (like from Google Maps API)
  const place2 = {
    name: 'Test Place 2',
    geometry: {
      location: {
        lat: () => 40.7128,
        lng: () => -74.0060
      }
    }
  };

  // Test case 3: Alternative location format
  const place3 = {
    name: 'Test Place 3',
    location: {
      lat: () => 51.5074,
      lng: () => -0.1278
    }
  };

  // Test the extraction logic
  function extractCoordinates(place) {
    let latitude = null;
    let longitude = null;
    
    if (place.location?.lat && place.location?.lng) {
      latitude = typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat;
      longitude = typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng;
    } else if (place.geometry?.location?.lat && place.geometry?.location?.lng) {
      latitude = typeof place.geometry.location.lat === 'function' ? place.geometry.location.lat() : place.geometry.location.lat;
      longitude = typeof place.geometry.location.lng === 'function' ? place.geometry.location.lng() : place.geometry.location.lng;
    }
    
    return { latitude, longitude };
  }

  // Test all cases
  console.log('Test 1 (Direct values):', extractCoordinates(place1));
  console.log('Test 2 (Function values):', extractCoordinates(place2));
  console.log('Test 3 (Alternative format):', extractCoordinates(place3));
  
  console.log('\n✅ All coordinate extraction tests completed!');
}

// Run the test
testCoordinateExtraction(); 