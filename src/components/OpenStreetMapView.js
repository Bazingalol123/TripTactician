import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Route, ExternalLink, Route as RouteIcon, Clock } from 'lucide-react';
import { calculateDayRoute, getOptimalTravelMode } from '../services/routingService';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons for different activity types
const createCustomIcon = (color, category) => {
  const iconColors = {
    restaurant: '#ef4444',
    sightseeing: '#3b82f6',
    culture: '#8b5cf6',
    entertainment: '#f59e0b',
    shopping: '#10b981',
    nature: '#22c55e',
    default: '#6b7280'
  };

  const iconColor = iconColors[category] || iconColors.default;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${iconColor};
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        border: 2px solid white;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 12px;
          font-weight: bold;
        ">
          ${category === 'restaurant' ? '🍽️' : category === 'sightseeing' ? '🏛️' : category === 'culture' ? '🎭' : '📍'}
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
  });
};

// Component to fit map bounds to show all markers
const FitBounds = ({ activities }) => {
  const map = useMap();
  
  useEffect(() => {
    if (activities && activities.length > 0) {
      const validActivities = activities.filter(a => a.latitude && a.longitude);
      if (validActivities.length > 0) {
        const bounds = L.latLngBounds(
          validActivities.map(activity => [activity.latitude, activity.longitude])
        );
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [activities, map]);

  return null;
};

const OpenStreetMapView = ({
  activities = [],
  selectedActivity = null,
  onMarkerClick = () => {},
  center = { lat: 40.7128, lng: -74.0060 },
  zoom = 13,
  height = '400px',
  className = ''
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [routes, setRoutes] = useState({});
  const [routingProgress, setRoutingProgress] = useState(null);
  const mapRef = useRef(null);

  // Filter activities with valid coordinates
  const validActivities = activities.filter(activity => 
    activity.latitude && activity.longitude &&
    !isNaN(activity.latitude) && !isNaN(activity.longitude) &&
    activity.latitude !== 0 && activity.longitude !== 0
  );

  // Show message if no valid coordinates
  if (validActivities.length === 0) {
    return (
      <div className={`openstreetmap-container ${className}`} style={{ height }}>
        <div className="flex flex-col items-center justify-center h-full bg-gray-50">
          <MapPin className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Map Data Available</h3>
          <p className="text-gray-500 text-center max-w-md">
            The activities in this trip don't have location coordinates yet. 
            The map will appear once locations are geocoded.
          </p>
        </div>
      </div>
    );
  }

  // Group activities by day for route visualization
  const activitiesByDay = validActivities.reduce((acc, activity) => {
    const day = activity.dayIndex || 0;
    if (!acc[day]) acc[day] = [];
    acc[day].push(activity);
    return acc;
  }, {});

  // Day colors for routes
  const dayColors = [
    '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', 
    '#ef4444', '#3b82f6', '#f97316', '#84cc16'
  ];

  // Calculate real routes for each day
  useEffect(() => {
    const calculateRoutes = async () => {
      if (Object.keys(activitiesByDay).length === 0) return;

      setRoutingProgress('Calculating optimal routes...');
      const newRoutes = {};

      for (const [day, dayActivities] of Object.entries(activitiesByDay)) {
        if (dayActivities.length < 2) continue;

        try {
          // Sort activities by time/index for proper routing order
          const sortedActivities = dayActivities.sort((a, b) => 
            (a.activityIndex || 0) - (b.activityIndex || 0)
          );

          // Get optimal travel mode for this day
          const travelMode = getOptimalTravelMode(sortedActivities);
          
          console.log(`🗺️ Calculating route for Day ${parseInt(day) + 1} (${travelMode})`);
          
          // Calculate the route
          const route = await calculateDayRoute(sortedActivities, travelMode);
          
          if (route && route.coordinates && route.coordinates.length > 0) {
            newRoutes[day] = {
              ...route,
              color: dayColors[parseInt(day) % dayColors.length],
              dayNumber: parseInt(day) + 1
            };
            console.log(`✅ Day ${parseInt(day) + 1} route: ${Math.round(route.distance/1000)}km, ${Math.round(route.duration/60)}min`);
          }
        } catch (error) {
          console.error(`Failed to calculate route for day ${day}:`, error);
          // Keep the old straight-line fallback for this day
          const sortedActivities = dayActivities.sort((a, b) => 
            (a.activityIndex || 0) - (b.activityIndex || 0)
          );
          const routePoints = sortedActivities.map(activity => 
            [activity.latitude, activity.longitude]
          );
          newRoutes[day] = {
            coordinates: routePoints,
            color: dayColors[parseInt(day) % dayColors.length],
            dayNumber: parseInt(day) + 1,
            fallback: true
          };
        }
      }

      setRoutes(newRoutes);
      setRoutingProgress(null);
    };

    calculateRoutes();
  }, [validActivities]);

  const handleMarkerClick = (activity) => {
    onMarkerClick(activity, activity.dayIndex, activity.activityIndex);
  };

  return (
    <div className={`openstreetmap-container ${className}`} style={{ height }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        whenCreated={() => setMapReady(true)}
      >
        {/* OpenStreetMap tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Fit bounds to show all activities */}
        <FitBounds activities={validActivities} />

        {/* Render markers for each activity */}
        {validActivities.map((activity, index) => (
          <Marker
            key={`${activity.dayIndex}-${activity.activityIndex}-${index}`}
            position={[activity.latitude, activity.longitude]}
            icon={createCustomIcon(
              dayColors[activity.dayIndex % dayColors.length],
              activity.category
            )}
            eventHandlers={{
              click: () => handleMarkerClick(activity)
            }}
          >
            <Popup>
              <div className="p-3 max-w-sm">
                <h3 className="font-semibold text-lg mb-2">{activity.name}</h3>
                <div className="space-y-1 text-sm">
                  <div><strong>Time:</strong> {activity.time} ({activity.duration} min)</div>
                  <div><strong>Location:</strong> {activity.location}</div>
                  <div><strong>Description:</strong> {activity.description}</div>
                  {activity.cost && (
                    <div><strong>Cost:</strong> ${activity.cost}</div>
                  )}
                  {activity.tips && (
                    <div><strong>Tips:</strong> {activity.tips}</div>
                  )}
                </div>
                
                <div className="flex gap-2 mt-3">
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${activity.latitude}&mlon=${activity.longitude}&zoom=16`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View on OSM
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activity.latitude},${activity.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                  >
                    <Navigation className="w-3 h-3 mr-1" />
                    Directions
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render REAL routes for each day */}
        {Object.entries(routes).map(([day, route]) => {
          if (!route.coordinates || route.coordinates.length < 2) return null;

          return (
            <Polyline
              key={`route-day-${day}`}
              positions={route.coordinates}
              color={route.color}
              weight={route.fallback ? 2 : 4}
              opacity={route.fallback ? 0.5 : 0.8}
              dashArray={route.fallback ? '5, 10' : null}
            >
              <Popup>
                <div className="p-2">
                  <h4 className="font-semibold">Day {route.dayNumber} Route</h4>
                  {route.distance && (
                    <div className="text-sm space-y-1">
                      <div><strong>Distance:</strong> {Math.round(route.distance/1000 * 10)/10} km</div>
                      <div><strong>Duration:</strong> {Math.round(route.duration/60)} minutes</div>
                      <div><strong>Mode:</strong> {route.profile || 'walking'}</div>
                      {route.fallback && (
                        <div className="text-orange-600 text-xs">⚠️ Approximate route</div>
                      )}
                    </div>
                  )}
                </div>
              </Popup>
            </Polyline>
          );
        })}
      </MapContainer>

      {/* Map controls overlay */}
      <div className="absolute top-4 right-4 z-1000 bg-white rounded-lg shadow-lg p-2">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.setView([center.lat, center.lng], zoom);
              }
            }}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Reset view"
          >
            <MapPin className="w-4 h-4" />
          </button>
          
          {validActivities.length > 0 && (
            <button
              onClick={() => {
                if (mapRef.current && validActivities.length > 0) {
                  const bounds = L.latLngBounds(
                    validActivities.map(activity => [activity.latitude, activity.longitude])
                  );
                  mapRef.current.fitBounds(bounds, { padding: [20, 20] });
                }
              }}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Fit all markers"
            >
              <RouteIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Routing progress overlay */}
      {routingProgress && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-1000 bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <div className="text-sm font-medium">{routingProgress}</div>
          </div>
        </div>
      )}

      {/* Route statistics */}
      {Object.keys(routes).length > 0 && (
        <div className="absolute top-4 left-4 z-1000 bg-white rounded-lg shadow-lg p-3 max-w-sm">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
            <RouteIcon className="w-4 h-4" />
            Trip Routes
          </h4>
          <div className="space-y-2 text-xs">
            {Object.entries(routes).map(([day, route]) => (
              <div key={day} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: route.color }}
                  />
                  <span>Day {route.dayNumber}</span>
                </div>
                <div className="text-gray-600">
                  {route.distance ? (
                    <>
                      {Math.round(route.distance/1000 * 10)/10}km • {Math.round(route.duration/60)}min
                      {route.fallback && <span className="text-orange-500"> ⚠️</span>}
                    </>
                  ) : (
                    'No route'
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend for activity types */}
      {validActivities.length > 0 && (
        <div className="absolute bottom-4 left-4 z-1000 bg-white rounded-lg shadow-lg p-3">
          <h4 className="font-semibold text-sm mb-2">Activity Types</h4>
          <div className="flex flex-wrap gap-2 text-xs">
            {Array.from(new Set(validActivities.map(a => a.category))).map(category => (
              <div key={category} className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: {
                      restaurant: '#ef4444',
                      sightseeing: '#3b82f6',
                      culture: '#8b5cf6',
                      entertainment: '#f59e0b',
                      shopping: '#10b981',
                      nature: '#22c55e'
                    }[category] || '#6b7280'
                  }}
                />
                <span className="capitalize">{category}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {!mapReady && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-1000">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenStreetMapView; 