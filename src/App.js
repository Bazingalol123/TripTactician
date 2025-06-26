import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import TripPlanner from './components/TripPlanner';
import ItineraryDisplay from './components/ItineraryDisplay';
import TripSummary from './components/TripSummary';
import ImageGallery from './components/ImageGallery';
import Recommendations from './components/Recommendations';
import PracticalInfo from './components/PracticalInfo';
import LoadingSpinner from './components/LoadingSpinner';
import Header from './components/Header';
import Footer from './components/Footer';
import SideMenu from './components/SideMenu';
import SearchModal from './components/SearchModal';

// Create a client with enhanced error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  const [itinerary, setItinerary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState('home'); // home, planner, itinerary, summary, recommendations, practical
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearchClick = () => {
    setCurrentView('planner');
    setIsSearchModalOpen(false);
    setIsMenuOpen(false);
  };

  const handleCloseSearchModal = () => {
    setIsSearchModalOpen(false);
  };

  const handleSearchSubmit = (searchTerm) => {
    console.log('Search initiated for:', searchTerm);
    setItinerary(null);
    setCurrentView('planner');
  };

  const handleGenerateItinerary = async (formData) => {
    setIsLoading(true);
    setCurrentView('loading');
    
    try {
      // Sanitize input data
      const sanitizedData = {
        ...formData,
        destination: formData.destination?.trim().slice(0, 100),
        interests: formData.interests?.slice(0, 10).map(interest => 
          typeof interest === 'string' ? interest.trim().slice(0, 50) : interest
        ),
        specialRequirements: formData.specialRequirements?.trim().slice(0, 500)
      };

      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Validate response data
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }
      
      setItinerary(data);
      setCurrentView('itinerary');
    } catch (error) {
      console.error('Error generating itinerary:', error);
      // Fallback to mock data if API fails
      const mockItinerary = generateMockItinerary(formData);
      setItinerary(mockItinerary);
      setCurrentView('itinerary');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockItinerary = (formData) => {
    const { destination, startDate, endDate, interests } = formData;
    
    // Sanitize inputs
    const sanitizedDestination = destination?.trim().slice(0, 100) || 'Unknown Destination';
    const sanitizedInterests = interests?.slice(0, 10) || [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    return {
      destination: sanitizedDestination,
      tripSummary: {
        duration: `${days} days`,
        bestTimeToVisit: 'Spring and Fall are ideal',
        budgetEstimate: '$150-300 per day'
      },
      dailyItineraries: Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        date: new Date(start.getTime() + i * 24 * 60 * 60 * 1000).toLocaleDateString(),
        theme: `Day ${i + 1} Adventure`,
        activities: [
          {
            time: '09:00',
            name: 'Local Attraction Visit',
            description: 'Explore the main attractions of the destination',
            location: 'City Center',
            duration: '2 hours',
            cost: '$20',
            tips: 'Best visited in the morning',
            category: 'attraction',
            latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
            longitude: -74.0060 + (Math.random() - 0.5) * 0.1
          },
          {
            time: '12:00',
            name: 'Local Restaurant',
            description: 'Enjoy authentic local cuisine',
            location: 'Downtown Area',
            duration: '1.5 hours',
            cost: '$30',
            tips: 'Try the local specialties',
            category: 'restaurant',
            latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
            longitude: -74.0060 + (Math.random() - 0.5) * 0.1
          },
          {
            time: '15:00',
            name: 'Cultural Experience',
            description: 'Immerse yourself in local culture',
            location: 'Cultural District',
            duration: '3 hours',
            cost: '$25',
            tips: 'Don\'t forget your camera',
            category: 'cultural',
            latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
            longitude: -74.0060 + (Math.random() - 0.5) * 0.1
          }
        ],
        transportation: 'Public transport or walking',
        meals: 'Breakfast at hotel, lunch at local restaurant',
        accommodation: 'Hotel in city center'
      })),
      practicalInfo: {
        bestTimeToVisit: 'Spring and Fall',
        transportation: 'Public transport available',
        accommodation: 'Hotels and hostels available',
        budget: 'Budget-friendly to luxury options',
        safety: 'Generally safe, standard precautions',
        packing: 'Comfortable walking shoes, weather-appropriate clothing'
      },
      recommendations: {
        mustSee: ['Main Square', 'Historical Museum', 'Local Market'],
        hiddenGems: ['Secret Garden', 'Local Art Gallery'],
        food: ['Traditional Dish', 'Local Street Food'],
        shopping: ['Artisan Market', 'Shopping District'],
        nightlife: ['Local Bar', 'Live Music Venue']
      },
      places: []
    };
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const handleReset = () => {
    setItinerary(null);
    setCurrentView('home');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="home-container"
          >
            <div className="hero-section">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="hero-title"
              >
                Plan Your Perfect Adventure
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="hero-subtitle"
              >
                AI-powered travel planning that creates personalized itineraries just for you
              </motion.p>
              <motion.button
                className="cta-button"
                onClick={() => setCurrentView('planner')}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Planning
              </motion.button>
            </div>
          </motion.div>
        );

      case 'planner':
        return (
          <motion.div
            key="planner"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <TripPlanner onGenerateItinerary={handleGenerateItinerary} />
          </motion.div>
        );

      case 'loading':
        return (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LoadingSpinner />
          </motion.div>
        );

      case 'itinerary':
        return itinerary ? (
          <motion.div
            key="itinerary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <ItineraryDisplay itinerary={itinerary} />
          </motion.div>
        ) : null;

      case 'summary':
        return itinerary ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <TripSummary itinerary={itinerary} />
          </motion.div>
        ) : null;

      case 'recommendations':
        return itinerary ? (
          <motion.div
            key="recommendations"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Recommendations 
              recommendations={itinerary.recommendations} 
              places={itinerary.places || []}
              destination={itinerary.destination}
            />
          </motion.div>
        ) : null;

      case 'practical':
        return itinerary ? (
          <motion.div
            key="practical"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <PracticalInfo practicalInfo={itinerary.practicalInfo} />
          </motion.div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <Header 
          onSearchClick={handleSearchClick} 
          currentView={currentView}
        />
        
        <SideMenu 
          isOpen={isMenuOpen} 
          toggleMenu={toggleMenu} 
          onNavigate={handleViewChange}
          onSearchClick={handleSearchClick}
        />
        
        {isMenuOpen && <div className="overlay" onClick={toggleMenu}></div>}

        <main className={`App-main ${isMenuOpen ? 'shifted' : ''}`}>
          <AnimatePresence mode="wait">
            {renderCurrentView()}
          </AnimatePresence>
        </main>
        
        <Footer />

        <SearchModal 
          isOpen={isSearchModalOpen} 
          onClose={handleCloseSearchModal} 
          onSearchSubmit={handleSearchSubmit}
        />
      </div>
      <Toaster position="top-right" reverseOrder={false} />
    </QueryClientProvider>
  );
}

export default App; 