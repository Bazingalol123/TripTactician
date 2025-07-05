import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import ProductionMapView from './ProductionMapView';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  DollarSign, 
  Download, 
  Share2, 
  Edit3, 
  ShoppingBag,
  Heart,
  Star,
  Camera,
  Navigation,
  Bookmark,
  Send,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Play,
  Image as ImageIcon,
  Plus,
  Sparkles,
  Database,
  Settings,
  Replace,
  Trash2,
  RotateCcw,
  Search,
  Filter,
  X,
  Check,
  Eye,
  Grid,
  Sun,
  Cloud,
  Utensils,
  Building,
  TreePine,
  Music,
  Info,
  Phone,
  Globe,
  Tag,
  ExternalLink
} from 'lucide-react';
import './TripViewScreen.css';

const TripViewScreen = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { currentTrip, fetchTripById, updateExistingTrip } = useTrip();
  const { user, token } = useAuth();
  const [selectedDay, setSelectedDay] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activeTab, setActiveTab] = useState('itinerary');

  // New states for comprehensive recommendations
  const [allRecommendations, setAllRecommendations] = useState({});
  const [carRentals, setCarRentals] = useState([]);
  const [loadingCarRentals, setLoadingCarRentals] = useState(false);
  const [activeRecommendationCategory, setActiveRecommendationCategory] = useState('restaurants');

  // NEW ⚡️ Dynamic category helpers
  const capitalize = (str = '') => str.charAt(0).toUpperCase() + str.slice(1);
  const getCategoryIcon = (key) => {
    const mapping = {
      restaurants: Utensils,
      lodging: Building,
      hotels: Building,
      hotel: Building,
      attractions: Camera,
      shopping: ShoppingBag,
      entertainment: Music,
      transportation: Navigation
    };
    return mapping[key] || MapPin;
  };

  // Build nav categories whenever recommendations or car rentals change
  const navCategories = React.useMemo(() => {
    const dynamicCats = Object.keys(allRecommendations || {}).map((key) => ({
      key,
      icon: getCategoryIcon(key),
      label: capitalize(key.replace(/_/g, ' ')),
      count: allRecommendations[key]?.length || 0
    }));
    const combined = [...dynamicCats];
    if (!combined.find(c => c.key === 'transportation')) {
      combined.push({ key: 'transportation', icon: Navigation, label: 'Car Rentals', count: carRentals.length });
    } else {
      // update count just in case
      combined.forEach(c => { if (c.key === 'transportation') c.count = carRentals.length; });
    }
    return combined;
  }, [allRecommendations, carRentals]);

  // Ensure active category is valid
  useEffect(() => {
    if (navCategories.length && !navCategories.find(c => c.key === activeRecommendationCategory)) {
      setActiveRecommendationCategory(navCategories[0].key);
    }
  }, [navCategories, activeRecommendationCategory]);

  // Derivations from state
  const isUnifiedTrip = currentTrip?.isUnified || (currentTrip?.generationMethod === 'unified-real-data');

  useEffect(() => {
    const loadTrip = async () => {
      if (tripId && tripId !== 'current') {
        setLoading(true);
        try {
          // Use the proper fetchTripById function from TripContext
          const result = await fetchTripById(tripId);
          
          if (result.success) {
            const trip = result.trip;
            
            // Debug logging for trip data
            console.log('🧳 Trip loaded:', {
              destination: trip.destination,
              duration: trip.duration,
              totalDays: trip.dailyItineraries?.length || 0
            });
            
            // Debug activities coordinates
            if (trip.dailyItineraries) {
              trip.dailyItineraries.forEach((day, dayIndex) => {
                const activitiesWithCoords = day.activities?.filter(a => a.latitude && a.longitude) || [];
                console.log(`📍 Day ${dayIndex + 1}: ${activitiesWithCoords.length} activities with coordinates out of ${day.activities?.length || 0} total`);
                
                // Log first few activities to check data structure
                if (day.activities && day.activities.length > 0) {
                  console.log('Sample activities for day', dayIndex + 1, ':', day.activities.slice(0, 2).map(a => ({
                    name: a.name,
                    latitude: a.latitude,
                    longitude: a.longitude,
                    location: a.location
                  })));
                }
              });
            }
            
            // Don't await loadRecommendations here - let it run in background
            loadRecommendations();
          } else {
            throw new Error(result.error || 'Failed to fetch trip');
          }
        } catch (error) {
          console.error('Failed to load trip:', error);
          navigate('/dashboard');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    // Only load if tripId has changed or if we don't have currentTrip data
    if (tripId && tripId !== currentTrip?._id) {
      loadTrip();
    } else if (!tripId) {
      setLoading(false);
    } else if (tripId === currentTrip?._id && currentTrip) {
      // Trip is already loaded, just clear loading state
      setLoading(false);
    }
  }, [tripId, fetchTripById, navigate, currentTrip?._id, token]);

  useEffect(() => {
    if (currentTrip && currentTrip.dailyItineraries?.length > 0) {
      setSelectedDay(0);
    }
  }, [currentTrip]);

  // Load recommendations and car rentals when trip data is available
  useEffect(() => {
    if (currentTrip && token) {
      if (isUnifiedTrip) {
        loadRecommendations();
      }
      loadCarRentals();
    }
  }, [currentTrip, token, isUnifiedTrip]);

  // Load all AI-powered recommendations
  const loadRecommendations = async () => {
    if (!currentTrip || !token) return;
    
    setLoadingRecommendations(true);
    try {
      // Load smart recommendations
      const smartRecommendationsBody = {
        destination: currentTrip.destination,
        duration: currentTrip.duration,
        interests: currentTrip.interests || [],
        budget: currentTrip.budget || 'moderate'
      };

      const response = await fetch('/api/smart-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(smartRecommendationsBody)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Smart recommendations received:', data);
        
        // Process and merge hotel categories
        const categories = data.data?.categories || {};
        const processedCategories = { ...categories };
        
        // Merge all hotel-related categories into lodging for UI consistency
        if (categories.lodging || categories.hotel || categories.motel) {
          processedCategories.lodging = [
            ...(categories.lodging || []),
            ...(categories.hotel || []),
            ...(categories.motel || [])
          ];
        }
        
        // Set both old format for backward compatibility and new categorized format
        setRecommendations(processedCategories?.restaurants || []);
        setAllRecommendations(processedCategories || {});
        
        console.log('Available recommendation categories:', Object.keys(processedCategories || {}));
        console.log('Restaurants found:', processedCategories?.restaurants?.length || 0);
        console.log('Total hotels found:', processedCategories?.lodging?.length || 0);
      }
      
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Load car rental options
  const loadCarRentals = async () => {
    if (!currentTrip) return;
    
    setLoadingCarRentals(true);
    try {
      const carRentalBody = {
        destination: currentTrip.destination,
        pickupDate: currentTrip.startDate,
        returnDate: currentTrip.endDate,
        driverAge: 25
      };

      const response = await fetch('/api/car-rentals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(carRentalBody)
      });
      
      if (response.ok) {
        const data = await response.json();
        setCarRentals(data.rentals || []);
      }
    } catch (error) {
      console.error('Failed to load car rentals:', error);
    } finally {
      setLoadingCarRentals(false);
    }
  };

  // Replace activity with recommendation
  const replaceActivity = async (dayIndex, activityIndex, recommendation) => {
    try {
      const tripId = String(currentTrip._id);
      const response = await fetch(`/api/trips/${tripId}/replace-activity`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          dayIndex,
          activityIndex,
          recommendation
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        await fetchTripById(tripId);
        alert('Activity replaced successfully!');
      } else {
        throw new Error('Failed to replace activity');
      }
    } catch (error) {
      console.error('Failed to replace activity:', error);
      alert('Failed to replace activity. Please try again.');
    }
  };

  // Add recommendation to trip
  const addRecommendation = async (dayIndex, recommendation, insertIndex = -1) => {
    try {
      const tripId = String(currentTrip._id);
      const response = await fetch(`/api/trips/${tripId}/add-recommendation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          dayIndex,
          recommendation,
          insertIndex
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        await fetchTripById(tripId);
        alert('Activity added successfully!');
      } else {
        throw new Error('Failed to add activity');
      }
    } catch (error) {
      console.error('Failed to add activity:', error);
      alert('Failed to add activity. Please try again.');
    }
  };

  // Remove activity
  const removeActivity = async (dayIndex, activityIndex) => {
    try {
      const tripId = String(currentTrip._id);
      const response = await fetch(`/api/trips/${tripId}/remove-activity`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          dayIndex,
          activityIndex
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        await fetchTripById(tripId);
        alert('Activity removed successfully!');
      } else {
        throw new Error('Failed to remove activity');
      }
    } catch (error) {
      console.error('Failed to remove activity:', error);
      alert('Failed to remove activity. Please try again.');
    }
  };

  // Calculate map center from trip activities
  const calculateMapCenter = () => {
    if (!currentTrip?.dailyItineraries) return null;
    
    const allActivities = currentTrip.dailyItineraries
      .flatMap(day => day.activities || [])
      .filter(activity => activity.latitude && activity.longitude && 
                          !isNaN(activity.latitude) && !isNaN(activity.longitude) &&
                          activity.latitude !== 0 && activity.longitude !== 0);
    
    if (allActivities.length === 0) {
      // Try to geocode the destination name
      console.log('📍 No activities with coordinates found, attempting to geocode destination...');
      return null; // Let the map component handle this case
    }
    
    // Calculate center from activities
    const avgLat = allActivities.reduce((sum, activity) => sum + activity.latitude, 0) / allActivities.length;
    const avgLng = allActivities.reduce((sum, activity) => sum + activity.longitude, 0) / allActivities.length;
    
    console.log(`📍 Map center calculated from ${allActivities.length} activities: ${avgLat}, ${avgLng}`);
    return { lat: avgLat, lng: avgLng };
  };

  // Get fallback coordinates for major destinations
  const getDestinationCoordinates = (destination) => {
    const cityCoords = {
      'italy': { lat: 41.9028, lng: 12.4964 }, // Rome
      'rome': { lat: 41.9028, lng: 12.4964 },
      'milan': { lat: 45.4642, lng: 9.1900 },
      'venice': { lat: 45.4408, lng: 12.3155 },
      'florence': { lat: 43.7696, lng: 11.2558 },
      'naples': { lat: 40.8518, lng: 14.2681 },
      'spain': { lat: 40.4168, lng: -3.7038 }, // Madrid
      'barcelona': { lat: 41.3851, lng: 2.1734 },
      'madrid': { lat: 40.4168, lng: -3.7038 },
      'seville': { lat: 37.3886, lng: -5.9823 },
      'france': { lat: 48.8566, lng: 2.3522 }, // Paris
      'paris': { lat: 48.8566, lng: 2.3522 },
      'london': { lat: 51.5074, lng: -0.1278 },
      'germany': { lat: 52.5200, lng: 13.4050 }, // Berlin
      'berlin': { lat: 52.5200, lng: 13.4050 },
      'amsterdam': { lat: 52.3676, lng: 4.9041 },
      'prague': { lat: 50.0755, lng: 14.4378 },
      'vienna': { lat: 48.2082, lng: 16.3738 },
      'athens': { lat: 37.9755, lng: 23.7348 }
    };
    
    const destLower = destination?.toLowerCase() || '';
    const match = Object.keys(cityCoords).find(city => destLower.includes(city));
    
    return cityCoords[match] || { lat: 41.9028, lng: 12.4964 }; // Default to Rome
  };

  // Diagnostic function to debug issues
  const runDiagnostics = () => {
    console.log('🔍 Running Trip Diagnostics...');
    
    // Check trip data
    if (!currentTrip) {
      console.error('❌ No current trip loaded');
      return;
    }
    
    console.log('✅ Trip loaded:', currentTrip.destination);
    
    // Check activities coordinates
    let totalActivities = 0;
    let activitiesWithCoords = 0;
    
    if (currentTrip.dailyItineraries) {
      currentTrip.dailyItineraries.forEach((day, dayIndex) => {
        const dayActivities = day.activities || [];
        const dayWithCoords = dayActivities.filter(a => a.latitude && a.longitude);
        
        totalActivities += dayActivities.length;
        activitiesWithCoords += dayWithCoords.length;
        
        console.log(`Day ${dayIndex + 1}: ${dayWithCoords.length}/${dayActivities.length} activities have coordinates`);
        
        // Show missing coordinates
        const missingCoords = dayActivities.filter(a => !a.latitude || !a.longitude);
        if (missingCoords.length > 0) {
          console.log(`  ❌ Missing coordinates:`, missingCoords.map(a => a.name));
        }
      });
    }
    
    console.log(`📊 Total: ${activitiesWithCoords}/${totalActivities} activities have coordinates`);
    
    // Check recommendations
    console.log('🍽️ Recommendations status:');
    console.log('  - All categories:', Object.keys(allRecommendations).length > 0 ? Object.keys(allRecommendations) : 'None loaded');
    console.log('  - Restaurants:', recommendations.length);
    console.log('  - Car rentals:', carRentals.length);
    
    // Check map center
    const mapCenter = calculateMapCenter();
    console.log('🗺️ Map center:', mapCenter);
    
    // Test API endpoints
    console.log('🔗 Testing API endpoints...');
    fetch('/api/smart-recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        destination: currentTrip.destination,
        duration: currentTrip.duration,
        interests: currentTrip.interests || [],
        budget: currentTrip.budget || 'moderate'
      })
    })
    .then(res => res.json())
    .then(data => {
      console.log('✅ Smart recommendations API test:', data);
    })
    .catch(err => {
      console.error('❌ Smart recommendations API failed:', err);
    });
    
    alert('Check browser console for detailed diagnostics!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Your Trip</h3>
          <p className="text-gray-600">Preparing your amazing adventure...</p>
        </div>
      </div>
    );
  }

  if (!currentTrip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Trip Not Found</h2>
          <p className="text-gray-600 mb-6">The trip you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const exportToPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Add trip header
      doc.setFontSize(20);
      doc.text(currentTrip.title, 20, 30);
      
      doc.setFontSize(12);
      doc.text(`${currentTrip.destination} • ${formatDate(currentTrip.startDate)} - ${formatDate(currentTrip.endDate)}`, 20, 45);
      doc.text(`${currentTrip.duration} days • Estimated Cost: $${currentTrip.estimatedCost}`, 20, 55);
      
      let yPosition = 75;
      
      // Add daily itineraries
      currentTrip.dailyItineraries?.forEach((day, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
        }
        
        doc.setFontSize(14);
        doc.text(`Day ${day.day}: ${day.theme}`, 20, yPosition);
        yPosition += 15;
        
        day.activities?.forEach((activity) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 30;
          }
          
          doc.setFontSize(10);
          doc.text(`${activity.time} - ${activity.name}`, 25, yPosition);
          yPosition += 8;
          doc.text(`${activity.location} • $${activity.cost}`, 25, yPosition);
          yPosition += 12;
        });
        
        yPosition += 10;
      });
      
      doc.save(`${currentTrip.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    }
  };

  const shareTrip = () => {
    setShowShareModal(true);
  };

  const copyTripLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('Trip link copied to clipboard! 📋');
    });
  };

  const bookItems = () => {
    alert('Booking integration coming soon! 🎉\n\nWe\'re working on partnerships with hotels, restaurants, and activity providers to make booking seamless.');
  };

  const modifyTrip = () => {
    navigate('/generate', { state: { editTrip: currentTrip } });
  };

  const editWithRecommendations = () => {
    navigate('/generate', { state: { editTrip: currentTrip } });
  };

  const viewRecommendations = () => {
    if (isUnifiedTrip && currentTrip.availableRecommendations) {
      // Show recommendations in a modal or navigate to recommendations view
      alert(`This trip has ${currentTrip.availableRecommendations.totalPlacesFound} additional recommendations available!\n\nClick "Edit with Recommendations" to add or modify places.`);
    }
  };

  // Toggle edit mode and load recommendations
  const toggleEditMode = () => {
    if (!editMode) {
      loadRecommendations();
    }
    setEditMode(!editMode);
    setShowRecommendations(!editMode);
  };

  // Specialized Recommendation Card Components
  const RestaurantCard = ({ restaurant, onAdd, onReplace }) => (
    <motion.div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <Utensils className="w-4 h-4 text-orange-500 mr-2" />
          <h4 className="font-semibold text-gray-900 text-sm">{restaurant.name}</h4>
        </div>
        <div className="flex items-center text-xs text-yellow-600">
          <Star className="w-3 h-3 fill-current mr-1" />
          {restaurant.rating?.toFixed(1) || 'N/A'}
        </div>
      </div>
      
      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{restaurant.vicinity || restaurant.address}</p>
      
      {restaurant.price_level && (
        <div className="mb-2">
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
            {'$'.repeat(restaurant.price_level)} • {restaurant.price_level === 1 ? 'Budget' : restaurant.price_level === 2 ? 'Moderate' : restaurant.price_level === 3 ? 'Expensive' : 'Very Expensive'}
          </span>
        </div>
      )}
      
      <div className="flex space-x-2">
        <button
          onClick={() => onAdd({...restaurant, category: 'restaurant'})}
          className="flex-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded hover:bg-orange-200 transition-colors"
        >
          <Plus className="w-3 h-3 inline mr-1" />
          Add to Trip
        </button>
        {selectedActivity && (
          <button
            onClick={() => onReplace({...restaurant, category: 'restaurant'})}
            className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
          >
            <Replace className="w-3 h-3 inline mr-1" />
            Replace
          </button>
        )}
      </div>
    </motion.div>
  );

  const HotelCard = ({ hotel, onAdd }) => (
    <motion.div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <Building className="w-4 h-4 text-blue-500 mr-2" />
          <h4 className="font-semibold text-gray-900 text-sm">{hotel.name}</h4>
        </div>
        <div className="flex items-center text-xs text-yellow-600">
          <Star className="w-3 h-3 fill-current mr-1" />
          {hotel.rating?.toFixed(1) || 'N/A'}
        </div>
      </div>
      
      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{hotel.vicinity || hotel.address}</p>
      
      <div className="mb-2">
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
          Accommodation
        </span>
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(hotel.name + ' hotel booking')}`, '_blank')}
          className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
        >
          <ExternalLink className="w-3 h-3 inline mr-1" />
          Book Hotel
        </button>
      </div>
    </motion.div>
  );

  const AttractionCard = ({ attraction, onAdd, onReplace }) => (
    <motion.div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <Camera className="w-4 h-4 text-purple-500 mr-2" />
          <h4 className="font-semibold text-gray-900 text-sm">{attraction.name}</h4>
        </div>
        <div className="flex items-center text-xs text-yellow-600">
          <Star className="w-3 h-3 fill-current mr-1" />
          {attraction.rating?.toFixed(1) || 'N/A'}
        </div>
      </div>
      
      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{attraction.vicinity || attraction.address}</p>
      
      <div className="mb-2">
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
          Tourist Attraction
        </span>
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={() => onAdd({...attraction, category: 'attraction'})}
          className="flex-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded hover:bg-purple-200 transition-colors"
        >
          <Plus className="w-3 h-3 inline mr-1" />
          Add to Trip
        </button>
        {selectedActivity && (
          <button
            onClick={() => onReplace({...attraction, category: 'attraction'})}
            className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
          >
            <Replace className="w-3 h-3 inline mr-1" />
            Replace
          </button>
        )}
      </div>
    </motion.div>
  );

  const CarRentalCard = ({ rental }) => (
    <motion.div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <Navigation className="w-4 h-4 text-green-500 mr-2" />
          <h4 className="font-semibold text-gray-900 text-sm">{rental.company}</h4>
        </div>
        <div className="flex items-center text-xs text-yellow-600">
          <Star className="w-3 h-3 fill-current mr-1" />
          {rental.rating?.toFixed(1) || 'N/A'}
        </div>
      </div>
      
      <div className="mb-2">
        <p className="text-sm font-medium text-gray-800">{rental.carType} - {rental.model}</p>
        <p className="text-xs text-gray-600">{rental.pickupLocation}</p>
      </div>
      
      <div className="flex justify-between items-center mb-2">
        <div>
          <span className="text-lg font-bold text-green-600">${rental.dailyRate}/day</span>
          <p className="text-xs text-gray-600">Total: ${rental.totalCost}</p>
        </div>
        <div className="text-right">
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
            {rental.mileagePolicy}
          </span>
        </div>
      </div>
      
      {rental.features && (
        <div className="mb-2">
          <div className="flex flex-wrap gap-1">
            {rental.features.slice(0, 3).map((feature, idx) => (
              <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex space-x-2">
        <button
          onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(rental.company + ' car rental booking')}`, '_blank')}
          className="flex-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 transition-colors"
        >
          <ExternalLink className="w-3 h-3 inline mr-1" />
          Book Rental
        </button>
      </div>
    </motion.div>
  );

  const ShoppingCard = ({ shop, onAdd, onReplace }) => (
    <motion.div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <ShoppingBag className="w-4 h-4 text-pink-500 mr-2" />
          <h4 className="font-semibold text-gray-900 text-sm">{shop.name}</h4>
        </div>
        <div className="flex items-center text-xs text-yellow-600">
          <Star className="w-3 h-3 fill-current mr-1" />
          {shop.rating?.toFixed(1) || 'N/A'}
        </div>
      </div>
      
      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{shop.vicinity || shop.address}</p>
      
      <div className="mb-2">
        <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded">
          Shopping
        </span>
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={() => onAdd({...shop, category: 'shopping'})}
          className="flex-1 px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded hover:bg-pink-200 transition-colors"
        >
          <Plus className="w-3 h-3 inline mr-1" />
          Add to Trip
        </button>
        {selectedActivity && (
          <button
            onClick={() => onReplace({...shop, category: 'shopping'})}
            className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
          >
            <Replace className="w-3 h-3 inline mr-1" />
            Replace
          </button>
        )}
      </div>
    </motion.div>
  );

  const EntertainmentCard = ({ venue, onAdd, onReplace }) => (
    <motion.div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <Music className="w-4 h-4 text-red-500 mr-2" />
          <h4 className="font-semibold text-gray-900 text-sm">{venue.name}</h4>
        </div>
        <div className="flex items-center text-xs text-yellow-600">
          <Star className="w-3 h-3 fill-current mr-1" />
          {venue.rating?.toFixed(1) || 'N/A'}
        </div>
      </div>
      
      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{venue.vicinity || venue.address}</p>
      
      <div className="mb-2">
        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
          Entertainment
        </span>
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={() => onAdd({...venue, category: 'entertainment'})}
          className="flex-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition-colors"
        >
          <Plus className="w-3 h-3 inline mr-1" />
          Add to Trip
        </button>
        {selectedActivity && (
          <button
            onClick={() => onReplace({...venue, category: 'entertainment'})}
            className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
          >
            <Replace className="w-3 h-3 inline mr-1" />
            Replace
          </button>
        )}
      </div>
    </motion.div>
  );

  // Legacy Recommendation Card Component (for backward compatibility)
  const RecommendationCard = ({ recommendation, onAdd, onReplace }) => (
    <motion.div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-900 text-sm">{recommendation.name}</h4>
        <div className="flex items-center text-xs text-yellow-600">
          <Star className="w-3 h-3 fill-current mr-1" />
          {recommendation.rating?.toFixed(1) || 'N/A'}
        </div>
      </div>
      
      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{recommendation.vicinity || recommendation.address}</p>
      
      <div className="flex space-x-2">
        <button
          onClick={() => onAdd(recommendation)}
          className="flex-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded hover:bg-emerald-200 transition-colors"
        >
          <Plus className="w-3 h-3 inline mr-1" />
          Add
        </button>
        {selectedActivity && (
          <button
            onClick={() => onReplace(recommendation)}
            className="flex-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded hover:bg-orange-200 transition-colors"
          >
            <Replace className="w-3 h-3 inline mr-1" />
            Replace
          </button>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {currentTrip.title || `${currentTrip.destination} Adventure`}
                </h1>
                <p className="text-sm text-gray-600">
                  {formatDate(currentTrip.startDate)} - {formatDate(currentTrip.endDate)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleEditMode}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                  editMode 
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                }`}
              >
                {editMode ? <X size={16} /> : <Edit3 size={16} />}
                <span>{editMode ? 'Exit Edit' : 'Edit Trip'}</span>
              </button>
              
              {/* Debug button - remove in production */}
              <button
                onClick={runDiagnostics}
                className="px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg font-medium text-sm transition-colors"
                title="Debug trip data"
              >
                🔍 Debug
              </button>
              
              <button
                onClick={shareTrip}
                className="p-2 text-gray-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
              >
                <Share2 size={20} />
              </button>
              
              <button
                onClick={exportToPDF}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Download size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 30% Side Panel / 70% Map */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* 30% Side Panel */}
        <div className="w-[30%] bg-white border-r border-gray-200 flex flex-col">
          {/* Trip Summary Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold">{currentTrip.destination}</h2>
                <p className="text-sm opacity-90">{currentTrip.duration} days • {formatDate(currentTrip.startDate)}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">${currentTrip.estimatedCost || '?'}</div>
                <div className="text-xs opacity-90">Total Budget</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="font-semibold">
                  {currentTrip.dailyItineraries?.reduce((total, day) => total + (day.activities?.length || 0), 0) || 0}
                </div>
                <div className="text-xs opacity-90">Activities</div>
              </div>
              <div>
                <div className="font-semibold">
                  {currentTrip.dailyItineraries?.reduce((total, day) => 
                    total + (day.activities?.filter(a => a.category === 'restaurant' || a.category === 'food')?.length || 0), 0) || 0}
                </div>
                <div className="text-xs opacity-90">Meals</div>
              </div>
              <div>
                <div className="font-semibold">4.2★</div>
                <div className="text-xs opacity-90">Avg Rating</div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 px-4 py-2">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('itinerary')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${
                  activeTab === 'itinerary'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Itinerary
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${
                  activeTab === 'info'
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Info className="w-4 h-4 mr-2" />
                Details
              </button>
              {editMode && (
                <button
                  onClick={() => setActiveTab('recommendations')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${
                    activeTab === 'recommendations'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Add Places
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'itinerary' && (
              <div>
                {/* Enhanced Day Navigation */}
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Daily Schedule</h3>
                  <div className="space-y-2">
                    {currentTrip.dailyItineraries?.map((day, index) => (
                      <motion.button
                        key={index}
                        onClick={() => setSelectedDay(index)}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          selectedDay === index
                            ? 'bg-blue-50 border-2 border-blue-200'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-sm text-gray-900">Day {day.day}</div>
                            <div className="text-xs text-gray-600 truncate">{day.theme}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-blue-600 font-medium">
                              {day.activities?.length || 0} stops
                            </div>
                            <div className="text-xs text-gray-500">
                              ${day.activities?.reduce((sum, a) => sum + (parseFloat(a.cost) || 0), 0).toFixed(0) || '0'}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Enhanced Daily Activities */}
                {currentTrip.dailyItineraries?.[selectedDay] && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">
                        Day {currentTrip.dailyItineraries[selectedDay].day}
                      </h3>
                      <div className="text-sm text-gray-600">
                        {currentTrip.dailyItineraries[selectedDay].activities?.length || 0} activities
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {currentTrip.dailyItineraries[selectedDay].activities?.map((activity, activityIndex) => (
                        <motion.div
                          key={activityIndex}
                          className={`border rounded-lg p-4 transition-all cursor-pointer ${
                            selectedActivity?.dayIndex === selectedDay && selectedActivity?.activityIndex === activityIndex
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                          }`}
                          onClick={() => setSelectedActivity({ dayIndex: selectedDay, activityIndex, activity })}
                          whileHover={{ scale: 1.01 }}
                        >
                          {/* Activity Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center mb-1">
                                {/* Category Icon */}
                                {activity.category === 'restaurant' || activity.category === 'food' ? (
                                  <Utensils className="w-4 h-4 text-orange-500 mr-2" />
                                ) : activity.category === 'attraction' || activity.category === 'culture' ? (
                                  <Camera className="w-4 h-4 text-purple-500 mr-2" />
                                ) : activity.category === 'park' ? (
                                  <TreePine className="w-4 h-4 text-green-500 mr-2" />
                                ) : activity.category === 'shopping' ? (
                                  <ShoppingBag className="w-4 h-4 text-pink-500 mr-2" />
                                ) : activity.category === 'entertainment' ? (
                                  <Music className="w-4 h-4 text-red-500 mr-2" />
                                ) : (
                                  <Building className="w-4 h-4 text-blue-500 mr-2" />
                                )}
                                <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">{activity.name}</h4>
                              </div>
                              
                              <div className="flex items-center text-xs text-blue-600 font-medium mb-1">
                                <Clock className="w-3 h-3 mr-1" />
                                {activity.time} • {activity.duration}
                              </div>
                            </div>
                            
                            <div className="text-right ml-3">
                              <div className="font-bold text-green-600 text-sm">${activity.cost}</div>
                              {activity.rating > 0 && (
                                <div className="flex items-center text-xs text-yellow-600">
                                  <Star className="w-3 h-3 fill-current mr-1" />
                                  {activity.rating}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Activity Description */}
                          <p className="text-xs text-gray-600 line-clamp-2 mb-3">{activity.description}</p>
                          
                          {/* Activity Details */}
                          <div className="space-y-2">
                            <div className="flex items-center text-xs text-gray-500">
                              <MapPin className="w-3 h-3 mr-2 flex-shrink-0" />
                              <span className="truncate">{activity.location}</span>
                            </div>
                            
                            {activity.tips && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                <div className="flex items-start">
                                  <Info className="w-3 h-3 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                                  <p className="text-xs text-yellow-800">{activity.tips}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {activity.category && (
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                  activity.category === 'restaurant' || activity.category === 'food' 
                                    ? 'bg-orange-100 text-orange-700'
                                    : activity.category === 'attraction' || activity.category === 'culture'
                                    ? 'bg-purple-100 text-purple-700'
                                    : activity.category === 'park'
                                    ? 'bg-green-100 text-green-700'
                                    : activity.category === 'shopping'
                                    ? 'bg-pink-100 text-pink-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {activity.category}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {activity.latitude && activity.longitude && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${activity.latitude},${activity.longitude}`, '_blank');
                                  }}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Get Directions"
                                >
                                  <Navigation className="w-3 h-3" />
                                </button>
                              )}
                              
                              {editMode && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeActivity(selectedDay, activityIndex);
                                  }}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Remove Activity"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Trip Details Tab */}
            {activeTab === 'info' && (
              <div className="p-4 space-y-6">
                {/* Weather & Best Times */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Sun className="w-4 h-4 mr-2 text-yellow-500" />
                    Weather & Tips
                  </h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <div className="text-gray-600">Current</div>
                        <div className="font-semibold text-blue-700">22°C Sunny</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Best Time</div>
                        <div className="font-semibold text-blue-700">May - October</div>
                      </div>
                    </div>
                    <p className="text-xs text-blue-800">Perfect weather for sightseeing! Light jacket recommended for evenings.</p>
                  </div>
                </div>

                {/* Local Insights */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Globe className="w-4 h-4 mr-2 text-green-500" />
                    Local Insights
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <h5 className="font-medium text-green-800 text-sm mb-1">💰 Money Tips</h5>
                      <p className="text-xs text-green-700">Cash preferred at local markets. ATMs widely available. Tipping 10-15% at restaurants.</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <h5 className="font-medium text-purple-800 text-sm mb-1">🚇 Transportation</h5>
                      <p className="text-xs text-purple-700">Metro system efficient. Day passes available. Walking highly recommended in city center.</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <h5 className="font-medium text-orange-800 text-sm mb-1">🍽️ Dining Culture</h5>
                      <p className="text-xs text-orange-700">Lunch 12-3pm, dinner after 8pm. Aperitivo 6-8pm is a must-try local tradition!</p>
                    </div>
                  </div>
                </div>

                {/* Emergency Contacts */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-red-500" />
                    Emergency Info
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-gray-600 text-xs">Emergency</div>
                        <div className="font-semibold">112</div>
                      </div>
                      <div>
                        <div className="text-gray-600 text-xs">Tourist Police</div>
                        <div className="font-semibold">+39 06 46861</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Language Basics */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Globe className="w-4 h-4 mr-2 text-blue-500" />
                    Quick Phrases
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hello</span>
                      <span className="font-medium">Ciao</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thank you</span>
                      <span className="font-medium">Grazie</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Excuse me</span>
                      <span className="font-medium">Scusi</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Where is...?</span>
                      <span className="font-medium">Dove è...?</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations Tab */}
            {activeTab === 'recommendations' && editMode && (
              <div className="flex flex-col h-full">
                {/* Recommendations Header */}
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
                    <Plus className="w-5 h-5 mr-2 text-emerald-600" />
                    Travel Services & Recommendations
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {selectedActivity 
                      ? `Selected: ${selectedActivity.activity.name} (Day ${selectedActivity.dayIndex + 1})`
                      : 'Browse recommendations and services for your trip. Click items to add to your itinerary.'
                    }
                  </p>
                  
                  {/* Category Navigation */}
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {navCategories.map(({ key, label, icon: Icon, count }) => (
                      <button
                        key={key}
                        onClick={() => setActiveRecommendationCategory(key)}
                        className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center space-x-2 ${
                          activeRecommendationCategory === key
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{`${label} (${count})`}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recommendations Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {loadingRecommendations ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent"></div>
                      <span className="ml-2 text-gray-600">Loading recommendations...</span>
                    </div>
                  ) : (
                    <div>
                      {/* Restaurants */}
                      {['restaurants','restaurant'].includes(activeRecommendationCategory) && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <Utensils className="w-4 h-4 mr-2 text-orange-500" />
                            Recommended Restaurants ({(allRecommendations.restaurants ?? allRecommendations.restaurant)?.length || 0})
                          </h4>
                          {(allRecommendations.restaurants ?? allRecommendations.restaurant)?.slice(0, 15).map((restaurant, index) => (
                            <RestaurantCard
                              key={index}
                              restaurant={restaurant}
                              onAdd={(rec) => addRecommendation(selectedDay, rec)}
                              onReplace={(rec) => {
                                if (selectedActivity) {
                                  replaceActivity(selectedActivity.dayIndex, selectedActivity.activityIndex, rec);
                                  setSelectedActivity(null);
                                }
                              }}
                            />
                          )) || <div className="text-gray-500 text-center py-8">No restaurants found</div>}
                        </div>
                      )}

                      {/* Hotels */}
                      {['hotels','lodging'].includes(activeRecommendationCategory) && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <Building className="w-4 h-4 mr-2 text-blue-500" />
                            Recommended Hotels ({allRecommendations.lodging?.length || 0})
                          </h4>
                          {allRecommendations.lodging?.slice(0, 10).map((hotel, index) => (
                            <HotelCard
                              key={index}
                              hotel={hotel}
                              onAdd={(rec) => addRecommendation(selectedDay, rec)}
                            />
                          )) || <div className="text-gray-500 text-center py-8">No hotels found</div>}
                        </div>
                      )}

                      {/* Attractions */}
                      {['attractions','attraction'].includes(activeRecommendationCategory) && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <Camera className="w-4 h-4 mr-2 text-purple-500" />
                            Tourist Attractions ({(allRecommendations.attractions ?? allRecommendations.attraction)?.length || 0})
                          </h4>
                          {(allRecommendations.attractions ?? allRecommendations.attraction)?.slice(0, 15).map((attraction, index) => (
                            <AttractionCard
                              key={index}
                              attraction={attraction}
                              onAdd={(rec) => addRecommendation(selectedDay, rec)}
                              onReplace={(rec) => {
                                if (selectedActivity) {
                                  replaceActivity(selectedActivity.dayIndex, selectedActivity.activityIndex, rec);
                                  setSelectedActivity(null);
                                }
                              }}
                            />
                          )) || <div className="text-gray-500 text-center py-8">No attractions found</div>}
                        </div>
                      )}

                      {/* Car Rentals */}
                      {activeRecommendationCategory === 'transportation' && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <Navigation className="w-4 h-4 mr-2 text-green-500" />
                            Car Rentals ({carRentals.length})
                          </h4>
                          {loadingCarRentals ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-t-transparent"></div>
                              <span className="ml-2 text-gray-600">Loading car rentals...</span>
                            </div>
                          ) : (
                            carRentals.map((rental, index) => (
                              <CarRentalCard key={index} rental={rental} />
                            ))
                          )}
                          {!loadingCarRentals && carRentals.length === 0 && (
                            <div className="text-gray-500 text-center py-8">No car rentals available</div>
                          )}
                        </div>
                      )}

                      {/* Shopping */}
                      {activeRecommendationCategory === 'shopping' && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <ShoppingBag className="w-4 h-4 mr-2 text-pink-500" />
                            Shopping Spots ({allRecommendations.shopping?.length || 0})
                          </h4>
                          {allRecommendations.shopping?.slice(0, 10).map((shop, index) => (
                            <ShoppingCard
                              key={index}
                              shop={shop}
                              onAdd={(rec) => addRecommendation(selectedDay, rec)}
                              onReplace={(rec) => {
                                if (selectedActivity) {
                                  replaceActivity(selectedActivity.dayIndex, selectedActivity.activityIndex, rec);
                                  setSelectedActivity(null);
                                }
                              }}
                            />
                          )) || <div className="text-gray-500 text-center py-8">No shopping venues found</div>}
                        </div>
                      )}

                      {/* Entertainment */}
                      {activeRecommendationCategory === 'entertainment' && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <Music className="w-4 h-4 mr-2 text-red-500" />
                            Entertainment & Nightlife ({allRecommendations.activities?.length || 0})
                          </h4>
                          {allRecommendations.activities?.slice(0, 10).map((venue, index) => (
                            <EntertainmentCard
                              key={index}
                              venue={venue}
                              onAdd={(rec) => addRecommendation(selectedDay, rec)}
                              onReplace={(rec) => {
                                if (selectedActivity) {
                                  replaceActivity(selectedActivity.dayIndex, selectedActivity.activityIndex, rec);
                                  setSelectedActivity(null);
                                }
                              }}
                            />
                          )) || <div className="text-gray-500 text-center py-8">No entertainment venues found</div>}
                        </div>
                      )}

                      {/* Generic Fallback for any other category */}
                      {!['restaurants','hotels','lodging','attractions','transportation','shopping','entertainment'].includes(activeRecommendationCategory) && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            {React.createElement(getCategoryIcon(activeRecommendationCategory), { className: 'w-4 h-4 mr-2 text-gray-500' })}
                            {capitalize(activeRecommendationCategory)} ({allRecommendations[activeRecommendationCategory]?.length || 0})
                          </h4>
                          {allRecommendations[activeRecommendationCategory]?.slice(0, 20).map((rec, index) => (
                            <RecommendationCard
                              key={index}
                              recommendation={rec}
                              onAdd={(r) => addRecommendation(selectedDay, r)}
                              onReplace={(r) => {
                                if (selectedActivity) {
                                  replaceActivity(selectedActivity.dayIndex, selectedActivity.activityIndex, r);
                                  setSelectedActivity(null);
                                }
                              }}
                            />
                          )) || <div className="text-gray-500 text-center py-8">No items found</div>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 70% Map Area */}
        <div className="w-[70%] relative">
          <ProductionMapView
            activities={currentTrip?.dailyItineraries?.[selectedDay]?.activities || []}
            selectedActivity={selectedActivity}
            onMarkerClick={(activity) => {
              console.log('Selected activity:', activity);
              setSelectedActivity(activity);
            }}
            center={calculateMapCenter() || { lat: 41.9028, lng: 12.4964 }}
            height="100%"
            className="h-full w-full"
            showControls={true}
            enableRouting={true}
            enableGeolocation={true}
          />
          
          {/* Floating Trip Stats */}
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
            <h4 className="font-semibold text-gray-900 mb-3">Trip Overview</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{currentTrip.duration} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Budget:</span>
                <span className="font-medium">${currentTrip.estimatedCost || 'TBD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Activities:</span>
                <span className="font-medium">
                  {currentTrip.dailyItineraries?.reduce((total, day) => total + (day.activities?.length || 0), 0) || 0}
                </span>
              </div>
              {isUnifiedTrip && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-emerald-600">
                    <Sparkles size={14} />
                    <span className="text-xs font-medium">Smart AI Trip</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Share Your Trip</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={copyTripLink}
                  className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Send size={16} className="text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Copy Link</p>
                    <p className="text-sm text-gray-500">Share via link</p>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    const text = `Check out my trip to ${currentTrip.destination}! ${window.location.href}`;
                    if (navigator.share) {
                      navigator.share({
                        title: currentTrip.title,
                        text: text,
                        url: window.location.href,
                      });
                    } else {
                      copyTripLink();
                    }
                  }}
                  className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Share2 size={16} className="text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Share</p>
                    <p className="text-sm text-gray-500">Use native sharing</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TripViewScreen; 