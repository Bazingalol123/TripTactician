import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, Star, Clock, DollarSign, Car, Route, Compass, Filter, Eye,
  Lightbulb, Navigation, Calendar, Users, Heart, ExternalLink, Loader, AlertCircle,
  Building, Utensils, ShoppingBag, Camera, TrendingUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getSmartRecommendations, searchCarRentals } from '../services/api';

const SmartTripRecommendations = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [recommendations, setRecommendations] = useState(null);
  const [carRentals, setCarRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [filters, setFilters] = useState({
    minRating: 0,
    priceLevel: 'all',
  });

  const tripParams = useMemo(() => ({
    destination: searchParams.get('destination') || '',
    duration: parseInt(searchParams.get('duration')) || 7,
    interests: searchParams.get('interests')?.split(',').filter(Boolean) || [],
    budget: searchParams.get('budget') || 'moderate',
    editMode: searchParams.get('editMode') === 'true',
    tripId: searchParams.get('tripId') || null
  }), [searchParams]);

  const { destination, duration, interests, budget, editMode, tripId } = tripParams;

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📡 Making API call to get smart recommendations...');
      
      const result = await getSmartRecommendations(destination, {
        duration,
        interests,
        budget,
        groupSize: 2
      });

      console.log('📊 API Response:', result);

      if (result.success) {
        setRecommendations(result.data);
        toast.success(`Found ${result.data.totalPlacesFound} great places!`);
      } else {
        throw new Error(result.error || 'Failed to get recommendations');
      }

      // Load car rentals if we have destination
      if (destination) {
        console.log('🚗 Loading car rentals...');
        try {
          const rentalResult = await searchCarRentals(
            destination,
            new Date().toISOString().split('T')[0], // Today
            new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // End date
          );
          if (rentalResult.success) {
            setCarRentals(rentalResult.rentals);
            console.log('✅ Car rentals loaded:', rentalResult.rentals);
          }
        } catch (rentalError) {
          console.warn('⚠️ Car rental loading failed:', rentalError);
        }
      }
    } catch (error) {
      console.error('❌ Smart recommendations error:', error);
      setError(error.message);
      toast.error(`Failed to load recommendations: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [destination, duration, interests, budget]);

  useEffect(() => {
    if (destination) {
      console.log('🚀 Loading recommendations for:', tripParams);
      loadRecommendations();
    } else {
      setError('No destination specified');
      setLoading(false);
    }
  }, [destination, loadRecommendations]);

  const allPlaces = useMemo(() => {
    if (!recommendations) return {};
    
    const filtered = {};
    for (const category in recommendations.categories) {
      filtered[category] = recommendations.categories[category].filter(place => {
        const rating = place.rating || 0;
        const price = place.price_level;

        if (rating < filters.minRating) return false;
        if (filters.priceLevel !== 'all' && price && price !== parseInt(filters.priceLevel)) return false;
        
        return true;
      });
    }
    return filtered;
  }, [recommendations, filters]);

  const handleCreateTrip = async () => {
    toast.success("Coming soon: This will generate a full itinerary!");
    // Later, this will navigate to the trip view page with the new trip ID
  };
  
  const PlaceCard = ({ place }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => setSelectedPlace(place)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900 text-lg">{place.name}</h3>
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
          <span className="text-sm font-medium">{place.rating?.toFixed(1) || 'N/A'}</span>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-2">{place.address}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-sm">{'$'.repeat(place.price_level || 1)}</span>
          </div>
          
          {place.aiScore && (
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">
                {place.aiScore.toFixed(0)}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {place.opening_hours?.open_now && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              Open Now
            </span>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(`https://www.google.com/maps/place/?q=place_id:${place.place_id}`, '_blank');
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {place.types && (
        <div className="mt-2 flex flex-wrap gap-1">
          {place.types.slice(0, 3).map(type => (
            <span
              key={type}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
            >
              {type.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );

  const CarRentalCard = ({ rental }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">{rental.company}</h3>
          <p className="text-gray-600">{rental.model}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">${rental.dailyRate}</div>
          <div className="text-sm text-gray-500">per day</div>
        </div>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Cost:</span>
          <span className="font-semibold">${rental.totalCost}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Pickup:</span>
          <span className="text-sm">{rental.pickupLocation}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Rating:</span>
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm ml-1">{rental.rating}</span>
          </div>
        </div>
      </div>
      
      <div className="mb-3">
        <div className="text-sm font-medium text-gray-700 mb-1">Features:</div>
        <div className="flex flex-wrap gap-1">
          {rental.features.map(feature => (
            <span
              key={feature}
              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mb-3">
        <div>{rental.cancellationPolicy}</div>
        <div>{rental.mileagePolicy}</div>
      </div>
      
      <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
        View Details & Book
      </button>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-lg text-gray-700">Finding the best spots for your trip...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-red-700">
        <AlertCircle className="w-12 h-12 mb-4" />
        <p className="text-lg font-semibold">Failed to load recommendations</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto py-8 px-4">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Trip Recommendations</h1>
          <p className="text-xl text-gray-600">For your {duration}-day trip to {destination}</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold">Filters</h3>
          
          <select 
            value={filters.minRating}
            onChange={(e) => setFilters(f => ({...f, minRating: Number(e.target.value)}))}
            className="p-2 border rounded-md"
          >
            <option value={0}>All Ratings</option>
            <option value={4}>4+ Stars</option>
            <option value={4.5}>4.5+ Stars</option>
          </select>

          <select
            value={filters.priceLevel}
            onChange={(e) => setFilters(f => ({...f, priceLevel: e.target.value}))}
            className="p-2 border rounded-md"
          >
            <option value="all">All Prices</option>
            <option value={1}>$</option>
            <option value={2}>$$</option>
            <option value={3}>$$$</option>
            <option value={4}>$$$$</option>
          </select>
        </div>

        {/* Action Button */}
        <div className="text-center my-8">
          <button 
            onClick={handleCreateTrip}
            className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
          >
            Generate Full Itinerary
          </button>
        </div>

        {/* Attractions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold flex items-center mb-4"><Camera className="mr-3 text-purple-500" /> Attractions ({allPlaces.attractions?.length || 0})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allPlaces.attractions?.map(place => <PlaceCard key={place.place_id} place={place} />)}
          </div>
        </section>

        {/* Restaurants */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold flex items-center mb-4"><Utensils className="mr-3 text-orange-500" /> Restaurants ({allPlaces.restaurants?.length || 0})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allPlaces.restaurants?.map(place => <PlaceCard key={place.place_id} place={place} />)}
          </div>
        </section>
        
        {/* Hotels */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold flex items-center mb-4"><Building className="mr-3 text-blue-500" /> Hotels ({allPlaces.hotels?.length || 0})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allPlaces.hotels?.map(place => <PlaceCard key={place.place_id} place={place} />)}
          </div>
        </section>

        {/* Shopping */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold flex items-center mb-4"><ShoppingBag className="mr-3 text-pink-500" /> Shopping ({allPlaces.shopping?.length || 0})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allPlaces.shopping?.map(place => <PlaceCard key={place.place_id} place={place} />)}
          </div>
        </section>

        {/* Car Rentals */}
        <section>
          <h2 className="text-2xl font-bold flex items-center mb-4"><Car className="mr-3 text-green-500" /> Car Rentals ({carRentals.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {carRentals.map(rental => <CarRentalCard key={rental.id} rental={rental} />)}
          </div>
        </section>

      </div>
    </div>
  );
};

export default SmartTripRecommendations; 