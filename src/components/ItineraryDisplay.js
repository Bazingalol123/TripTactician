import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, DollarSign, Star, ChevronDown, ChevronUp, Heart, Share2, Bookmark, Navigation, Route, Play, Pause } from 'lucide-react';
import { loadGoogleMapsAPI } from '../utils/mapsLoader';
import './ItineraryDisplay.css';

const ItineraryDisplay = ({ itinerary }) => {
  const [expandedDay, setExpandedDay] = useState(0);
  const [favorites, setFavorites] = useState(new Set());
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [routePolyline, setRoutePolyline] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isRoutePlaying, setIsRoutePlaying] = useState(false);
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0);
  const [mapLoading, setMapLoading] = useState(true);
  const mapRef = useRef(null);
  const routeIntervalRef = useRef(null);

  // Get all activities with coordinates
  const allActivities = itinerary?.dailyItineraries?.flatMap((day, dayIndex) =>
    day.activities?.map((activity, activityIndex) => ({
      ...activity,
      dayIndex,
      activityIndex,
      dayNumber: day.day,
      dayDate: day.date,
      dayTheme: day.theme
    })) || []
  ).filter(activity => activity.latitude && activity.longitude) || [];

  // Initialize Google Map
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setMapLoading(true);
        await loadGoogleMapsAPI();
        
        if (mapRef.current && !map && window.google) {
          const newMap = new window.google.maps.Map(mapRef.current, {
            center: { lat: 0, lng: 0 },
            zoom: 12,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              },
              {
                featureType: 'transit',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              },
              {
                featureType: 'landscape',
                stylers: [{ color: '#f8fafc' }]
              },
              {
                featureType: 'road',
                stylers: [{ color: '#ffffff' }]
              }
            ],
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
            gestureHandling: 'cooperative'
          });
          setMap(newMap);
        }
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
      } finally {
        setMapLoading(false);
      }
    };

    initializeMap();
  }, [map]);

  // Update map with activities and route
  useEffect(() => {
    if (map && allActivities.length > 0 && !mapLoading) {
      // Clear existing markers and route
      markers.forEach(marker => marker.setMap(null));
      if (routePolyline) {
        routePolyline.setMap(null);
      }
      
      const newMarkers = [];
      const bounds = new window.google.maps.LatLngBounds();
      const routeCoordinates = [];

      allActivities.forEach((activity, index) => {
        const position = { lat: activity.latitude, lng: activity.longitude };
        routeCoordinates.push(position);

        // Create custom marker
        const marker = new window.google.maps.Marker({
          position,
          map: map,
          title: activity.name,
          label: {
            text: `${index + 1}`,
            color: 'white',
            fontWeight: 'bold'
          },
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="#667eea" stroke="white" stroke-width="2"/>
                <circle cx="16" cy="16" r="6" fill="white"/>
                <text x="16" y="20" text-anchor="middle" font-size="12" font-weight="bold" fill="#667eea">${index + 1}</text>
              </svg>
            `)}`,
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 16)
          }
        });

        // Create info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 12px; max-width: 250px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 16px; font-weight: 600;">${activity.name}</h3>
              <p style="margin: 0 0 6px 0; color: #64748b; font-size: 14px;">${activity.description}</p>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="color: #667eea; font-weight: 500;">Day ${activity.dayNumber}</span>
                <span style="color: #64748b;">•</span>
                <span style="color: #64748b;">${activity.time}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 4px; color: #64748b; font-size: 12px;">
                <span>📍</span>
                <span>${activity.location}</span>
              </div>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
          setSelectedActivity(activity);
          map.panTo(position);
          map.setZoom(16);
        });

        newMarkers.push(marker);
        bounds.extend(position);
      });

      setMarkers(newMarkers);

      // Create route polyline
      if (routeCoordinates.length > 1) {
        const polyline = new window.google.maps.Polyline({
          path: routeCoordinates,
          geodesic: true,
          strokeColor: '#667eea',
          strokeOpacity: 0.8,
          strokeWeight: 4,
          icons: [{
            icon: {
              path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW
            },
            offset: '50%',
            repeat: '100px'
          }]
        });
        polyline.setMap(map);
        setRoutePolyline(polyline);
      }

      // Fit map to show all markers
      if (newMarkers.length > 0) {
        map.fitBounds(bounds);
        if (newMarkers.length === 1) {
          map.setZoom(15);
        }
      }
    }
  }, [map, allActivities, mapLoading]);

  // Route animation
  useEffect(() => {
    if (isRoutePlaying && allActivities.length > 0) {
      routeIntervalRef.current = setInterval(() => {
        setCurrentRouteIndex(prev => {
          const next = prev + 1;
          if (next >= allActivities.length) {
            setIsRoutePlaying(false);
            return 0;
          }
          
          // Pan to next activity
          const activity = allActivities[next];
          map.panTo({ lat: activity.latitude, lng: activity.longitude });
          map.setZoom(16);
          
          return next;
        });
      }, 3000);
    } else {
      if (routeIntervalRef.current) {
        clearInterval(routeIntervalRef.current);
      }
    }

    return () => {
      if (routeIntervalRef.current) {
        clearInterval(routeIntervalRef.current);
      }
    };
  }, [isRoutePlaying, allActivities, map]);

  const toggleDay = (dayIndex) => {
    setExpandedDay(expandedDay === dayIndex ? -1 : dayIndex);
  };

  const toggleFavorite = (activityId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(activityId)) {
      newFavorites.delete(activityId);
    } else {
      newFavorites.add(activityId);
    }
    setFavorites(newFavorites);
  };

  const shareItinerary = () => {
    if (navigator.share) {
      navigator.share({
        title: `My Trip to ${itinerary.destination}`,
        text: `Check out my amazing itinerary for ${itinerary.destination}!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here
    }
  };

  const toggleRoutePlay = () => {
    setIsRoutePlaying(!isRoutePlaying);
    if (!isRoutePlaying) {
      setCurrentRouteIndex(0);
      const firstActivity = allActivities[0];
      if (firstActivity) {
        map.panTo({ lat: firstActivity.latitude, lng: firstActivity.longitude });
        map.setZoom(16);
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const dayVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const activityVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'attraction':
        return '🏛️';
      case 'restaurant':
        return '🍽️';
      case 'transport':
        return '🚗';
      case 'leisure':
        return '🎯';
      default:
        return '📍';
    }
  };

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'attraction':
        return '#ff6b6b';
      case 'restaurant':
        return '#4ecdc4';
      case 'transport':
        return '#45b7d1';
      case 'leisure':
        return '#96ceb4';
      default:
        return '#feca57';
    }
  };

  if (!itinerary || !itinerary.dailyItineraries) {
    return (
      <div className="itinerary-display empty">
        <p>No itinerary data available</p>
      </div>
    );
  }

  return (
    <motion.div
      className="itinerary-display"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with Actions */}
      <motion.div 
        className="itinerary-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-content">
          <div className="destination-info">
            <h1>{itinerary.destination}</h1>
            <p className="trip-duration">
              <Calendar size={16} />
              {itinerary.tripSummary?.duration || `${itinerary.dailyItineraries.length} days`}
            </p>
          </div>
          <div className="header-actions">
            <motion.button
              className="action-btn route-btn"
              onClick={toggleRoutePlay}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isRoutePlaying ? <Pause size={18} /> : <Play size={18} />}
              {isRoutePlaying ? 'Pause Route' : 'Play Route'}
            </motion.button>
            <motion.button
              className="action-btn share-btn"
              onClick={shareItinerary}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 size={18} />
              Share
            </motion.button>
            <motion.button
              className="action-btn bookmark-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bookmark size={18} />
              Save
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Interactive Map */}
      <motion.div 
        className="map-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="map-header">
          <div className="map-title">
            <Route size={20} />
            <h3>Trip Route</h3>
          </div>
          <div className="map-stats">
            <span>{allActivities.length} stops</span>
            <span>•</span>
            <span>{itinerary.dailyItineraries?.length || 0} days</span>
          </div>
        </div>
        
        <div className="map-container">
          <div ref={mapRef} className="google-map" />
          
          {isRoutePlaying && (
            <motion.div 
              className="route-progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="progress-bar">
                <motion.div 
                  className="progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentRouteIndex + 1) / allActivities.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="progress-text">
                {currentRouteIndex + 1} of {allActivities.length}
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Daily Itineraries */}
      <div className="itinerary-content">
        {itinerary.dailyItineraries?.map((day, dayIndex) => (
          <motion.div
            key={dayIndex}
            className={`day-card ${expandedDay === dayIndex ? 'expanded' : ''}`}
            variants={dayVariants}
            whileHover={{ y: -2 }}
          >
            <motion.div
              className="day-header"
              onClick={() => toggleDay(dayIndex)}
              whileHover={{ backgroundColor: '#f8fafc' }}
            >
              <div className="day-info">
                <div className="day-number">
                  <span className="day-label">Day</span>
                  <span className="day-value">{day.day}</span>
                </div>
                <div className="day-details">
                  <h3 className="day-date">{day.date}</h3>
                  <p className="day-theme">{day.theme}</p>
                </div>
              </div>
              <div className="day-stats">
                <div className="stat">
                  <Clock size={14} />
                  <span>{day.activities?.length || 0} activities</span>
                </div>
                <motion.div
                  className="expand-icon"
                  animate={{ rotate: expandedDay === dayIndex ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {expandedDay === dayIndex ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </motion.div>
              </div>
            </motion.div>

            <AnimatePresence>
              {expandedDay === dayIndex && (
                <motion.div
                  className="day-content"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Activities */}
                  <div className="activities-section">
                    <h4>Activities</h4>
                    <div className="activities-grid">
                      {day.activities?.map((activity, activityIndex) => {
                        const activityId = `${dayIndex}-${activityIndex}`;
                        const hasCoordinates = activity.latitude && activity.longitude;
                        
                        return (
                          <motion.div
                            key={activityIndex}
                            className={`activity-card ${hasCoordinates ? 'has-location' : ''} ${selectedActivity?.dayIndex === dayIndex && selectedActivity?.activityIndex === activityIndex ? 'selected' : ''}`}
                            variants={activityVariants}
                            whileHover={{ 
                              scale: 1.02,
                              boxShadow: "0 8px 25px rgba(0,0,0,0.15)"
                            }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="activity-header">
                              <div className="activity-time">
                                <Clock size={14} />
                                {activity.time}
                              </div>
                              <div className="activity-actions">
                                {hasCoordinates && (
                                  <motion.button
                                    className="location-btn"
                                    onClick={() => {
                                      map.panTo({ lat: activity.latitude, lng: activity.longitude });
                                      map.setZoom(16);
                                      setSelectedActivity({ ...activity, dayIndex, activityIndex });
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    title="Show on map"
                                  >
                                    <Navigation size={14} />
                                  </motion.button>
                                )}
                                <motion.button
                                  className={`favorite-btn ${favorites.has(activityId) ? 'favorited' : ''}`}
                                  onClick={() => toggleFavorite(activityId)}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Heart 
                                    size={16} 
                                    fill={favorites.has(activityId) ? '#ef4444' : 'none'}
                                  />
                                </motion.button>
                              </div>
                            </div>
                            
                            <h5 className="activity-name">{activity.name}</h5>
                            <p className="activity-description">{activity.description}</p>
                            
                            <div className="activity-details">
                              <div className="detail-item">
                                <MapPin size={14} />
                                <span>{activity.location}</span>
                              </div>
                              <div className="detail-item">
                                <Clock size={14} />
                                <span>{activity.duration}</span>
                              </div>
                              <div className="detail-item">
                                <DollarSign size={14} />
                                <span>{activity.cost}</span>
                              </div>
                            </div>
                            
                            {activity.tips && (
                              <div className="activity-tips">
                                <Star size={14} />
                                <span>{activity.tips}</span>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Additional Day Info */}
                  <div className="day-additional-info">
                    <div className="info-card">
                      <h5>Transportation</h5>
                      <p>{day.transportation}</p>
                    </div>
                    <div className="info-card">
                      <h5>Meals</h5>
                      <p>{day.meals}</p>
                    </div>
                    <div className="info-card">
                      <h5>Accommodation</h5>
                      <p>{day.accommodation}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Summary Footer */}
      <motion.div 
        className="itinerary-footer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="footer-content">
          <div className="footer-stats">
            <div className="stat-item">
              <span className="stat-number">{itinerary.dailyItineraries?.length || 0}</span>
              <span className="stat-label">Days</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {itinerary.dailyItineraries?.reduce((total, day) => total + (day.activities?.length || 0), 0) || 0}
              </span>
              <span className="stat-label">Activities</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{favorites.size}</span>
              <span className="stat-label">Favorites</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{allActivities.length}</span>
              <span className="stat-label">Map Stops</span>
            </div>
          </div>
          <p className="footer-note">
            ✨ Your personalized itinerary is ready! Click on activities to see them on the map, or play the route to visualize your journey.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ItineraryDisplay; 