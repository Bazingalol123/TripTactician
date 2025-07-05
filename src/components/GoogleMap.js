import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useMaps } from '../context/MapsContext';
import { AlertTriangle } from 'lucide-react';
import './GoogleMap.css';

const ACTIVITY_TYPE_COLORS = {
  restaurant: 'red',
  attraction: 'blue',
  park: 'green',
  culture: 'purple',
  shopping: 'orange',
  entertainment: 'yellow',
};

const GoogleMap = ({
  activities = [],
  selectedActivity = null,
  onMarkerClick = () => {},
  visibleActivityTypes = 'all',
  selectedDay = null,
  currentLocation = null,
}) => {
  const { isLoaded, loadError } = useMaps();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const polylineRef = useRef(null);
  const currentLocationMarkerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  // Debug: log activities
  console.log('GoogleMap activities:', activities);
  console.log('GoogleMap isLoaded:', isLoaded, 'loadError:', loadError);

  // Helper to get color by type
  const getMarkerColor = (type) => {
    const color = ACTIVITY_TYPE_COLORS[type?.toLowerCase()] || '#888'; // fallback color
    return color;
  };

  // Filter activities by type and day
  const filteredActivities = activities.filter((a) => {
    const typeMatch = visibleActivityTypes === 'all' || a.category?.toLowerCase() === visibleActivityTypes;
    const dayMatch = selectedDay === null || a.dayIndex === selectedDay;
    return typeMatch && dayMatch;
  });

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;
    
    if (window.google && window.google.maps) {
      console.log('Initializing Google Map...');
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 0, lng: 0 },
        zoom: 2,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
      });
      setMapReady(true);
    }
  }, [isLoaded]);

  // Update markers and polylines when activities/filter change
  useEffect(() => {
    if (!isLoaded || !mapReady || !mapInstanceRef.current || !window.google) return;
    
    console.log('Updating map with', filteredActivities.length, 'activities');
    
    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }
    
    if (!filteredActivities.length) return;
    
    const bounds = new window.google.maps.LatLngBounds();
    const routeCoords = [];
    
    filteredActivities.forEach((activity, idx) => {
      if (!activity.latitude || !activity.longitude) return;
      
      const position = { lat: activity.latitude, lng: activity.longitude };
      routeCoords.push(position);
      
      // Custom SVG marker by type
      const color = getMarkerColor(activity.category);
      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: activity.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: color,
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#fff',
        },
        zIndex: selectedActivity && selectedActivity.dayIndex === activity.dayIndex && selectedActivity.activityIndex === activity.activityIndex ? 999 : 1,
      });
      
      marker.addListener('click', () => {
        onMarkerClick(activity, activity.dayIndex, activity.activityIndex);
        // InfoWindow
        if (infoWindowRef.current) infoWindowRef.current.close();
        const directionsUrl = activity.latitude && activity.longitude
          ? `https://www.google.com/maps/dir/?api=1&destination=${activity.latitude},${activity.longitude}`
          : '';
        const streetViewUrl = activity.latitude && activity.longitude
          ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${activity.latitude},${activity.longitude}`
          : '';
        infoWindowRef.current = new window.google.maps.InfoWindow({
          content: `
            <div style='font-family:sans-serif;max-width:250px;'>
              <h3 style='margin:0 0 8px 0;'>${activity.name}</h3>
              <div><b>Time:</b> ${activity.time} (${activity.duration})</div>
              <div><b>Location:</b> ${activity.location}</div>
              <div><b>Description:</b> ${activity.description}</div>
              ${activity.cost ? `<div><b>Cost:</b> ${activity.cost}</div>` : ''}
              ${activity.tips ? `<div><b>Tips:</b> ${activity.tips}</div>` : ''}
              <div style='margin-top:8px;'>
                ${directionsUrl ? `<a href='${directionsUrl}' target='_blank' rel='noopener noreferrer' style='display:inline-block;padding:6px 12px;background:#2196f3;color:#fff;border-radius:4px;text-decoration:none;font-size:14px;margin-right:6px;'>Directions</a>` : ''}
                ${streetViewUrl ? `<a href='${streetViewUrl}' target='_blank' rel='noopener noreferrer' style='display:inline-block;padding:6px 12px;background:#43a047;color:#fff;border-radius:4px;text-decoration:none;font-size:14px;'>Street View</a>` : ''}
              </div>
            </div>
          `
        });
        infoWindowRef.current.open(mapInstanceRef.current, marker);
      });
      
      markersRef.current.push(marker);
      bounds.extend(position);
    });
    
    // Draw route polyline for the day
    if (routeCoords.length > 1) {
      polylineRef.current = new window.google.maps.Polyline({
        path: routeCoords,
        geodesic: true,
        strokeColor: '#2196f3',
        strokeOpacity: 0.8,
        strokeWeight: 4,
      });
      polylineRef.current.setMap(mapInstanceRef.current);
    }
    
    // Fit bounds to show all markers
    if (!bounds.isEmpty()) {
      mapInstanceRef.current.fitBounds(bounds);
    }
    
    // Pan/zoom to selectedActivity
    if (selectedActivity && selectedActivity.latitude && selectedActivity.longitude) {
      mapInstanceRef.current.panTo({ lat: selectedActivity.latitude, lng: selectedActivity.longitude });
      mapInstanceRef.current.setZoom(16);
      // Open InfoWindow for selected
      const idx = filteredActivities.findIndex(a => a.dayIndex === selectedActivity.dayIndex && a.activityIndex === selectedActivity.activityIndex);
      if (idx !== -1 && markersRef.current[idx]) {
        if (infoWindowRef.current) infoWindowRef.current.close();
        const directionsUrl = selectedActivity.latitude && selectedActivity.longitude
          ? `https://www.google.com/maps/dir/?api=1&destination=${selectedActivity.latitude},${selectedActivity.longitude}`
          : '';
        const streetViewUrl = selectedActivity.latitude && selectedActivity.longitude
          ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedActivity.latitude},${selectedActivity.longitude}`
          : '';
        infoWindowRef.current = new window.google.maps.InfoWindow({
          content: `
            <div style='font-family:sans-serif;max-width:250px;'>
              <h3 style='margin:0 0 8px 0;'>${selectedActivity.name}</h3>
              <div><b>Time:</b> ${selectedActivity.time} (${selectedActivity.duration})</div>
              <div><b>Location:</b> ${selectedActivity.location}</div>
              <div><b>Description:</b> ${selectedActivity.description}</div>
              ${selectedActivity.cost ? `<div><b>Cost:</b> ${selectedActivity.cost}</div>` : ''}
              ${selectedActivity.tips ? `<div><b>Tips:</b> ${selectedActivity.tips}</div>` : ''}
              <div style='margin-top:8px;'>
                ${directionsUrl ? `<a href='${directionsUrl}' target='_blank' rel='noopener noreferrer' style='display:inline-block;padding:6px 12px;background:#2196f3;color:#fff;border-radius:4px;text-decoration:none;font-size:14px;margin-right:6px;'>Directions</a>` : ''}
                ${streetViewUrl ? `<a href='${streetViewUrl}' target='_blank' rel='noopener noreferrer' style='display:inline-block;padding:6px 12px;background:#43a047;color:#fff;border-radius:4px;text-decoration:none;font-size:14px;'>Street View</a>` : ''}
              </div>
            </div>
          `
        });
        infoWindowRef.current.open(mapInstanceRef.current, markersRef.current[idx]);
      }
    }
  }, [isLoaded, mapReady, filteredActivities, selectedActivity, visibleActivityTypes, selectedDay]);

  // Show current location marker and pan/zoom
  useEffect(() => {
    if (!isLoaded || !mapReady || !mapInstanceRef.current || !window.google) return;
    
    if (currentLocation) {
      if (currentLocationMarkerRef.current) {
        currentLocationMarkerRef.current.setMap(null);
      }
      currentLocationMarkerRef.current = new window.google.maps.Marker({
        position: currentLocation,
        map: mapInstanceRef.current,
        title: 'Current Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#1976d2',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#fff',
        },
        zIndex: 2000,
      });
      mapInstanceRef.current.panTo(currentLocation);
      mapInstanceRef.current.setZoom(15);
    } else if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.setMap(null);
      currentLocationMarkerRef.current = null;
    }
  }, [isLoaded, mapReady, currentLocation]);

  // Error state
  if (loadError) {
    return (
      <div className="google-map-container" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <AlertTriangle style={{ width: '48px', height: '48px', color: '#ef4444', margin: '0 auto 16px' }} />
          <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>Map Loading Error</h3>
          <p style={{ color: '#7f1d1d', fontSize: '14px' }}>{loadError}</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (!isLoaded) {
    return (
      <div className="google-map-container" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <h3 style={{ color: '#374151', marginBottom: '8px' }}>Loading Map</h3>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Initializing Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="google-map-container" style={{ height: '400px', width: '100%' }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
};

GoogleMap.propTypes = {
  activities: PropTypes.array,
  selectedActivity: PropTypes.object,
  onMarkerClick: PropTypes.func,
  visibleActivityTypes: PropTypes.string,
  selectedDay: PropTypes.number,
  currentLocation: PropTypes.object,
};

export default GoogleMap; 