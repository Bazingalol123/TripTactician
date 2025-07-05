import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Star, 
  Navigation, 
  Calendar,
  Users,
  Heart,
  Download,
  Share2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  ExternalLink,
  Phone,
  Globe
} from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import OpenStreetMapView from './OpenStreetMapView';
import { calculateDayRoute, getOptimalTravelMode } from '../services/routingService';
import './TripItineraryView.css';

const libraries = ['places', 'geometry'];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const dayColors = [
  '#06b6d4', // cyan
  '#8b5cf6', // purple  
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#3b82f6', // blue
  '#f97316', // orange
  '#84cc16', // lime
];

const TripItineraryView = ({ trip, isVisible = true, onClose }) => {
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [expandedDays, setExpandedDays] = useState(new Set([0]));
  const [map, setMap] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);

  const mapRef = useRef(null);

  // Initialize map center from first activity
  useEffect(() => {
    if (trip?.dailyItineraries?.[0]?.activities?.[0]) {
      const firstActivity = trip.dailyItineraries[0].activities[0];
      if (firstActivity.latitude && firstActivity.longitude) {
        setMapCenter({
          lat: firstActivity.latitude,
          lng: firstActivity.longitude
        });
      }
    }
  }, [trip]);

  // Update map when selected day changes
  useEffect(() => {
    if (map && trip?.dailyItineraries?.[selectedDay]) {
      calculateRouteForDay(selectedDay);
    }
  }, [map, selectedDay, trip]);

  const onMapLoad = (mapInstance) => {
    setMap(mapInstance);
  };

  const calculateRouteForDay = async (dayIndex) => {
    if (!map) return;

    const day = trip.dailyItineraries[dayIndex];
    const activitiesWithCoords = day.activities?.filter(
      activity => activity.latitude && activity.longitude
    ) || [];

    // Clear existing route
    if (directionsRenderer) {
      directionsRenderer.setMap(null);
    }

    if (activitiesWithCoords.length < 2) return;

    try {
      console.log(`🗺️ Calculating route for Day ${dayIndex + 1}...`);
      
      // Get optimal travel mode for this day
      const travelMode = getOptimalTravelMode(activitiesWithCoords);
      console.log(`🚶 Travel mode: ${travelMode}`);
      
      // Use the routing service for real road routing
      const route = await calculateDayRoute(activitiesWithCoords, travelMode);
      
      if (route && route.coordinates && route.coordinates.length > 0) {
        // Create path for Google Maps
        const path = route.coordinates.map(coord => ({
          lat: coord[0],
          lng: coord[1]
        }));

        // Create polyline for the route
        const polyline = new window.google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: dayColors[dayIndex % dayColors.length],
          strokeOpacity: 1.0,
          strokeWeight: 4,
          map: map
        });

        // Store reference to clear later
        setDirectionsRenderer(polyline);
        
        console.log(`✅ Route displayed: ${Math.round(route.distance/1000)}km, ${Math.round(route.duration/60)}min`);
      } else {
        console.warn('⚠️ Route calculation returned no coordinates');
      }

    } catch (error) {
      console.error('Failed to calculate route:', error);
      console.log('🔄 Falling back to no route display');
    }
  };

  const toggleDay = (dayIndex) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayIndex)) {
        newSet.delete(dayIndex);
      } else {
        newSet.add(dayIndex);
      }
      return newSet;
    });
  };

  const handleActivityClick = (activity, dayIndex) => {
    setSelectedActivity(activity);
    setSelectedDay(dayIndex);
    setShowInfoWindow(true);
    
    if (map && activity.latitude && activity.longitude) {
      map.panTo({ lat: activity.latitude, lng: activity.longitude });
      map.setZoom(16);
    }
  };

  const handleDaySelect = (dayIndex) => {
    setSelectedDay(dayIndex);
    if (!expandedDays.has(dayIndex)) {
      toggleDay(dayIndex);
    }
    
    // Pan to first activity of the day
    const firstActivity = trip.dailyItineraries[dayIndex]?.activities?.[0];
    if (map && firstActivity?.latitude && firstActivity?.longitude) {
      map.panTo({ lat: firstActivity.latitude, lng: firstActivity.longitude });
      map.setZoom(14);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      sightseeing: '🏛️',
      dining: '🍽️',
      culture: '🎨',
      entertainment: '🎭',
      shopping: '🛍️',
      nature: '🌿',
      transport: '🚗',
      accommodation: '🏨',
      nightlife: '🌙'
    };
    return icons[category] || '📍';
  };

  const getMarkerIcon = (activity, isSelected = false) => {
    const color = isSelected ? '#ef4444' : dayColors[selectedDay % dayColors.length];
    
    // Use a simple circle marker instead of complex SVG to avoid encoding issues
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 8
    };
  };

  if (!isVisible || !trip || !trip.dailyItineraries) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden">
      <div className="flex h-full">
        {/* Left Panel - Itinerary List */}
        <div className="itinerary-panel overflow-y-auto">
          {/* Header */}
          <div className="p-6 bg-white shadow-sm border-b">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{trip.title}</h1>
                <p className="text-gray-600 mt-1">{trip.destination}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{trip.duration} days</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span>{formatCurrency(trip.estimatedCost)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  Save
                </button>
                <button className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  Export
                </button>
                <button className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50 flex items-center gap-1">
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
                {onClose && (
                  <button onClick={onClose} className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50">
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Days Navigation */}
          <div className="p-6 bg-white border-b">
            <div className="flex gap-2 overflow-x-auto">
              {trip.dailyItineraries.map((day, index) => (
                <button
                  key={index}
                  onClick={() => handleDaySelect(index)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                    selectedDay === index 
                      ? 'text-white' 
                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  }`}
                  style={{
                    backgroundColor: selectedDay === index ? dayColors[index % dayColors.length] : undefined
                  }}
                >
                  <div>Day {day.day}</div>
                  <div className="text-xs opacity-75">{day.theme}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Itinerary Content */}
          <div className="p-6 space-y-6">
            {trip.dailyItineraries.map((day, dayIndex) => (
              <div key={dayIndex} className={`${selectedDay === dayIndex ? 'block' : 'hidden'}`}>
                <div className="space-y-4">
                  {day.activities?.map((activity, actIndex) => (
                    <div
                      key={actIndex}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedActivity === activity 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      onClick={() => handleActivityClick(activity, dayIndex)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Time Column */}
                        <div className="text-sm font-medium text-gray-500 min-w-[60px]">
                          {formatTime(activity.time)}
                        </div>

                        {/* Optional thumbnail */}
                        {activity.photos && Array.isArray(activity.photos) && activity.photos.length > 0 && (
                          <img
                            src={activity.photos[0]}
                            alt={activity.name}
                            className="w-16 h-16 rounded object-cover flex-shrink-0"
                          />
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getCategoryIcon(activity.category)}</span>
                              <div>
                                <h4 className="font-medium text-gray-900">{activity.name}</h4>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {activity.location}
                                </p>
                              </div>
                            </div>
                            {activity.cost > 0 && (
                              <div className="text-sm font-medium text-green-600">
                                {formatCurrency(activity.cost)}
                              </div>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-2">{activity.description}</p>
                          
                          {activity.tips && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                              <Lightbulb className="h-3 w-3" />
                              <span>{activity.tips}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>{activity.duration} min</span>
                            {activity.bookingRequired && (
                              <span className="bg-red-100 text-red-700 px-2 py-1 rounded">
                                Booking Required
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="map-panel">
          <div className="p-4 border-b">
            <h3 className="font-medium text-gray-900">Route Map - Day {selectedDay + 1}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: dayColors[selectedDay % dayColors.length] }}
              />
              <span className="text-sm text-gray-600">Current Route</span>
            </div>
          </div>
          
          <div className="h-full p-4">
            <TripMap 
              trip={trip}
              selectedDay={selectedDay}
              selectedActivity={selectedActivity}
              onActivityClick={handleActivityClick}
              dayColors={dayColors}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Separate Map Component - NOW USING FREE OPENSTREETMAP!
const TripMap = ({ trip, selectedDay, selectedActivity, onActivityClick, dayColors }) => {
  // Get center coordinates from the first activity of the selected day
  const mapCenter = useMemo(() => {
    const dayActivities = trip.dailyItineraries[selectedDay]?.activities || [];
    const firstActivityWithCoords = dayActivities.find(a => a.latitude && a.longitude);
    
    if (firstActivityWithCoords) {
      return {
        lat: firstActivityWithCoords.latitude,
        lng: firstActivityWithCoords.longitude
      };
    }
    
    // Fallback to a default location
    return { lat: 40.7128, lng: -74.0060 };
  }, [trip, selectedDay]);

  // Prepare activities with day/activity indices for OpenStreetMapView
  const activitiesWithIndices = trip.dailyItineraries[selectedDay]?.activities?.map((activity, index) => ({
    ...activity,
    dayIndex: selectedDay,
    activityIndex: index
  })) || [];

  return (
    <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden">
      <OpenStreetMapView
        activities={activitiesWithIndices}
        selectedActivity={selectedActivity}
        onMarkerClick={onActivityClick}
        center={mapCenter}
        zoom={13}
        height="100%"
        className="w-full h-full"
      />
    </div>
  );
};

export default TripItineraryView; 