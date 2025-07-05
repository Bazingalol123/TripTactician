import React, { createContext, useContext, useState, useEffect } from 'react';
import { geocodeLocation, searchPlaces, getRoute } from '../services/mapsService';

const FreeMapContext = createContext();

export const FreeMapProvider = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(true); // Always available (no API key needed)
  const [loadError, setLoadError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    console.log('🗺️ Free Map Provider initialized');
    console.log('✅ Using OpenStreetMap (completely free!)');
    
    // Try to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          console.log('📍 Current location obtained');
        },
        (error) => {
          console.log('📍 Location access denied or unavailable');
        }
      );
    }
  }, []);

  // Geocoding function
  const geocode = async (address) => {
    try {
      const result = await geocodeLocation(address);
      return {
        lat: result.latitude,
        lng: result.longitude,
        formatted_address: result.formatted_address
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  };

  // Places search function
  const searchNearbyPlaces = async (location, category = 'tourist_attraction') => {
    try {
      const places = await searchPlaces(location, category);
      return places.map(place => ({
        place_id: place.place_id,
        name: place.name,
        formatted_address: place.formatted_address,
        geometry: {
          location: {
            lat: place.latitude,
            lng: place.longitude
          }
        },
        rating: place.rating,
        price_level: place.price_level,
        types: place.types,
        opening_hours: place.opening_hours,
        website: place.website,
        category: place.category
      }));
    } catch (error) {
      console.error('Places search error:', error);
      return [];
    }
  };

  // Route calculation
  const calculateRoute = async (origin, destination, travelMode = 'driving') => {
    try {
      const route = await getRoute(origin, destination, travelMode);
      return {
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry,
        steps: route.steps
      };
    } catch (error) {
      console.error('Route calculation error:', error);
      throw error;
    }
  };

  const contextValue = {
    isLoaded,
    loadError,
    currentLocation,
    geocode,
    searchNearbyPlaces,
    calculateRoute,
    setCurrentLocation
  };

  return (
    <FreeMapContext.Provider value={contextValue}>
      {children}
    </FreeMapContext.Provider>
  );
};

export const useFreeMap = () => {
  const context = useContext(FreeMapContext);
  if (context === undefined) {
    throw new Error('useFreeMap must be used within a FreeMapProvider');
  }
  return context;
};

export default FreeMapContext; 