import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, ShoppingBag, Coffee, Moon, Heart, Clock, DollarSign, Navigation } from 'lucide-react';
import { loadGoogleMapsAPI } from '../utils/mapsLoader';
import './Recommendations.css';

const Recommendations = ({ recommendations = {}, places = [], destination }) => {
  const { mustSee = [], hiddenGems = [], food = [], shopping = [], nightlife = [] } = recommendations;
  const [selectedCategory, setSelectedCategory] = useState('mustSee');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [mapLoading, setMapLoading] = useState(true);
  const mapRef = useRef(null);

  const recommendationSections = [
    {
      id: 'mustSee',
      title: 'Must See',
      items: mustSee,
      icon: Star,
      color: '#ff6b6b',
      description: 'Essential attractions you can\'t miss'
    },
    {
      id: 'hiddenGems',
      title: 'Hidden Gems',
      items: hiddenGems,
      icon: MapPin,
      color: '#4ecdc4',
      description: 'Local favorites and off-the-beaten-path spots'
    },
    {
      id: 'food',
      title: 'Local Food',
      items: food,
      icon: Coffee,
      color: '#45b7d1',
      description: 'Authentic local cuisine and dining experiences'
    },
    {
      id: 'shopping',
      title: 'Shopping',
      items: shopping,
      icon: ShoppingBag,
      color: '#96ceb4',
      description: 'Best places to shop and find souvenirs'
    },
    {
      id: 'nightlife',
      title: 'Nightlife',
      items: nightlife,
      icon: Moon,
      color: '#feca57',
      description: 'Bars, clubs, and evening entertainment'
    }
  ];

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

  // Update map with places data
  useEffect(() => {
    if (map && places.length > 0 && !mapLoading) {
      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));
      
      const newMarkers = [];
      const bounds = new window.google.maps.LatLngBounds();

      places.forEach((place, index) => {
        if (place.geometry && place.geometry.location) {
          const marker = new window.google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: place.name,
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="#667eea" stroke="white" stroke-width="2"/>
                  <circle cx="12" cy="12" r="4" fill="white"/>
                </svg>
              `)}`,
              scaledSize: new window.google.maps.Size(24, 24),
              anchor: new window.google.maps.Point(12, 12)
            }
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; max-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: #333; font-size: 14px;">${place.name}</h3>
                ${place.rating ? `<p style="margin: 0 0 4px 0; color: #666; font-size: 12px;">⭐ ${place.rating}/5 (${place.user_ratings_total} reviews)</p>` : ''}
                ${place.vicinity ? `<p style="margin: 0; color: #666; font-size: 12px;">📍 ${place.vicinity}</p>` : ''}
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
            setSelectedPlace(place);
          });

          newMarkers.push(marker);
          bounds.extend(place.geometry.location);
        }
      });

      setMarkers(newMarkers);
      
      if (newMarkers.length > 0) {
        map.fitBounds(bounds);
        if (newMarkers.length === 1) {
          map.setZoom(15);
        }
      }
    }
  }, [map, places, mapLoading]);

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedPlace(null);
  };

  const handlePlaceClick = (place) => {
    setSelectedPlace(place);
    if (map && place.geometry && place.geometry.location) {
      map.panTo(place.geometry.location);
      map.setZoom(16);
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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      className="recommendations-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="recommendations-header">
        <h2>Explore {destination}</h2>
        <p className="recommendations-subtitle">
          Discover the best places to visit, eat, and explore with our interactive map
        </p>
      </div>

      <div className="recommendations-layout">
        {/* Left Panel - Recommendations */}
        <motion.div 
          className="recommendations-panel"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Category Tabs */}
          <div className="category-tabs">
            {recommendationSections.map((section) => (
              <motion.button
                key={section.id}
                className={`category-tab ${selectedCategory === section.id ? 'active' : ''}`}
                onClick={() => handleCategoryChange(section.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ borderLeftColor: section.color }}
              >
                <section.icon className="tab-icon" style={{ color: section.color }} />
                <span>{section.title}</span>
              </motion.button>
            ))}
          </div>

          {/* Selected Category Content */}
          <div className="category-content">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCategory}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="category-items"
              >
                <div className="category-header">
                  <h3>{recommendationSections.find(s => s.id === selectedCategory)?.title}</h3>
                  <p>{recommendationSections.find(s => s.id === selectedCategory)?.description}</p>
                </div>

                <div className="items-grid">
                  {recommendationSections.find(s => s.id === selectedCategory)?.items.map((item, index) => (
                    <motion.div
                      key={index}
                      className="recommendation-item"
                      variants={itemVariants}
                      whileHover={{ 
                        scale: 1.02, 
                        boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                        y: -2
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="item-icon">
                        <Star size={16} />
                      </div>
                      <div className="item-content">
                        <h4>{typeof item === 'string' ? item : item.name || 'Unknown'}</h4>
                        {typeof item === 'object' && item.description && (
                          <p>{item.description}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Travel Tips */}
          <motion.div 
            className="travel-tips"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3>💡 Travel Tips</h3>
            <div className="tips-grid">
              <div className="tip">
                <Clock size={16} />
                <span>Visit popular spots early morning to avoid crowds</span>
              </div>
              <div className="tip">
                <DollarSign size={16} />
                <span>Set a daily budget and track your expenses</span>
              </div>
              <div className="tip">
                <Navigation size={16} />
                <span>Download offline maps for areas with poor signal</span>
              </div>
              <div className="tip">
                <Heart size={16} />
                <span>Try local cuisine and ask locals for recommendations</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Panel - Interactive Map */}
        <motion.div 
          className={`map-container ${mapLoading ? 'loading' : ''}`}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="map-header">
            <h3>Interactive Map</h3>
            <p>Click on markers to see details and get directions</p>
          </div>
          
          <div ref={mapRef} className="google-map" />
          
          {selectedPlace && (
            <motion.div 
              className="place-details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="place-header">
                <h4>{selectedPlace.name}</h4>
                <button 
                  className="close-btn"
                  onClick={() => setSelectedPlace(null)}
                >
                  ×
                </button>
              </div>
              {selectedPlace.rating && (
                <div className="place-rating">
                  <span>⭐ {selectedPlace.rating}/5</span>
                  <span>({selectedPlace.user_ratings_total} reviews)</span>
                </div>
              )}
              {selectedPlace.vicinity && (
                <p className="place-address">📍 {selectedPlace.vicinity}</p>
              )}
              {selectedPlace.price_level && (
                <p className="place-price">
                  {'💰'.repeat(selectedPlace.price_level)} Price Level
                </p>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Recommendations; 