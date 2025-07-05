import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search,
  Filter,
  MapPin, 
  Calendar, 
  Users, 
  Star,
  Clock,
  ChevronDown,
  Grid3X3,
  List,
  MoreHorizontal,
  Settings,
  User,
  LogOut,
  Bookmark,
  Share2,
  Download,
  Edit3,
  Trash2,
  Eye
} from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const ElegantDashboard = () => {
  const { userTrips, loadingTrips, deleteExistingTrip } = useTrip();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [viewMode, setViewMode] = useState('grid');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filteredTrips = userTrips.filter(trip => {
    const matchesSearch = trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trip.destination.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || trip.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleDeleteTrip = async (tripId) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      const result = await deleteExistingTrip(tripId);
      if (result.success) {
        toast.success('Trip deleted successfully');
      } else {
        toast.error('Failed to delete trip');
      }
    }
  };

  const getTripStats = () => {
    return {
      total: userTrips.length,
      planning: userTrips.filter(t => t.status === 'planning').length,
      active: userTrips.filter(t => t.status === 'active').length,
      completed: userTrips.filter(t => t.status === 'completed').length
    };
  };

  const stats = getTripStats();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'planning':
        return '#f59e0b';
      case 'active':
        return '#10b981';
      case 'completed':
        return '#0ea5e9';
      default:
        return '#71717a';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
                <MapPin size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Trip Tactician</h1>
              </div>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button 
                className="flex items-center space-x-3 text-sm rounded-lg p-2 hover:bg-gray-50 transition-colors"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {user?.firstName?.[0] || 'U'}
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Hi, {user?.firstName}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <User size={16} className="mr-3" />
                      Profile
                    </button>
                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <Settings size={16} className="mr-3" />
                      Settings
                    </button>
                    <button 
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => navigate('/command-center')}
                    >
                      <MapPin size={16} className="mr-3" />
                      AI Command Center
                    </button>
                    <hr className="my-1" />
                    <button 
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={logout}
                    >
                      <LogOut size={16} className="mr-3" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Your Travel Dashboard
              </h2>
              <p className="text-gray-600">
                Plan, organize, and share your next adventure with AI-powered insights
              </p>
            </div>
            
            <motion.button
              className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors"
              onClick={() => navigate('/trip-setup')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={20} />
              <span>Plan New Trip</span>
            </motion.button>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Total Trips', value: stats.total, icon: MapPin, color: 'bg-blue-50 text-blue-600' },
              { label: 'Planning', value: stats.planning, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
              { label: 'Active', value: stats.active, icon: Calendar, color: 'bg-green-50 text-green-600' },
              { label: 'Completed', value: stats.completed, icon: Star, color: 'bg-purple-50 text-purple-600' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Trips Section */}
        <section>
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <h3 className="text-xl font-semibold text-gray-900">Your Trips</h3>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
                {filteredTrips.length} trips
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search trips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              {/* Filter */}
              <div className="relative">
                <button 
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter size={16} />
                  <span>Filter</span>
                  <ChevronDown size={14} />
                </button>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {[
                        { value: 'all', label: 'All Trips' },
                        { value: 'planning', label: 'Planning' },
                        { value: 'active', label: 'Active' },
                        { value: 'completed', label: 'Completed' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                            filterStatus === option.value ? 'bg-sky-50 text-sky-600' : 'text-gray-700'
                          }`}
                          onClick={() => {
                            setFilterStatus(option.value);
                            setShowFilters(false);
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* View Mode */}
              <div className="flex border border-gray-300 rounded-lg">
                <button
                  className={`p-2 ${viewMode === 'grid' ? 'bg-sky-500 text-white' : 'text-gray-600 hover:bg-gray-50'} rounded-l-lg transition-colors`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  className={`p-2 ${viewMode === 'list' ? 'bg-sky-500 text-white' : 'text-gray-600 hover:bg-gray-50'} rounded-r-lg transition-colors`}
                  onClick={() => setViewMode('list')}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Trips Grid/List */}
          {loadingTrips ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your trips...</p>
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin size={32} className="text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No trips found</h4>
              <p className="text-gray-600 mb-6">Start planning your next adventure!</p>
              <button 
                className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 mx-auto transition-colors"
                onClick={() => navigate('/trip-setup')}
              >
                <Plus size={16} />
                <span>Create Your First Trip</span>
              </button>
            </div>
          ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {filteredTrips.map((trip, index) => (
                <TripCard
                  key={trip._id}
                  trip={trip}
                  index={index}
                  viewMode={viewMode}
                  onView={() => navigate(`/trip/${String(trip._id)}`)}
                  onEdit={() => navigate(`/trip-setup?edit=${String(trip._id)}`)}
                  onDelete={() => handleDeleteTrip(String(trip._id))}
                  formatDate={formatDate}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

// Trip Card Component
const TripCard = ({ trip, index, viewMode, onView, onEdit, onDelete, formatDate, getStatusColor }) => {
  const [showActions, setShowActions] = useState(false);

  if (viewMode === 'list') {
    return (
      <motion.div
        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        layout
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
              <MapPin size={24} className="text-sky-500 opacity-60" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{trip.title}</h4>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                <MapPin size={14} />
                <span>{trip.destination}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                <div className="flex items-center space-x-1">
                  <Calendar size={14} />
                  <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
                </div>
                {trip.dailyItineraries && (
                  <div className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>{trip.dailyItineraries.length} days</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span 
              className="px-3 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: getStatusColor(trip.status) }}
            >
              {trip.status}
            </span>
            <button
              className="text-sky-600 hover:text-sky-700 font-medium"
              onClick={onView}
            >
              View Trip
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      layout
    >
      {/* Trip Image */}
      <div className="relative">
        <div className="w-full h-48 bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
          <div className="text-center text-sky-600">
            <MapPin size={48} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">{trip.destination}</p>
          </div>
        </div>
        <div 
          className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: getStatusColor(trip.status) }}
        >
          {trip.status}
        </div>
        
        {/* Actions Menu */}
        <div className="absolute top-4 left-4">
          <div className="relative">
            <button 
              className="w-8 h-8 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full flex items-center justify-center transition-all"
              onClick={() => setShowActions(!showActions)}
            >
              <MoreHorizontal size={16} className="text-gray-700" />
            </button>
            
            <AnimatePresence>
              {showActions && (
                <motion.div
                  className="absolute top-10 left-0 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <button className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={onView}>
                    <Eye size={14} className="mr-2" />
                    View
                  </button>
                  <button className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={onEdit}>
                    <Edit3 size={14} className="mr-2" />
                    Edit
                  </button>
                  <button className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Share2 size={14} className="mr-2" />
                    Share
                  </button>
                  <button className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Download size={14} className="mr-2" />
                    Export
                  </button>
                  <hr className="my-1" />
                  <button className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50" onClick={onDelete}>
                    <Trash2 size={14} className="mr-2" />
                    Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Trip Info */}
      <div className="p-6">
        <div className="mb-3">
          <h4 className="font-semibold text-gray-900 mb-1">{trip.title}</h4>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin size={14} className="mr-1" />
            <span>{trip.destination}</span>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <Calendar size={14} className="mr-2" />
            <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
          </div>
          
          {trip.dailyItineraries && (
            <div className="flex items-center">
              <Clock size={14} className="mr-2" />
              <span>{trip.dailyItineraries.length} days</span>
            </div>
          )}
        </div>

        {trip.estimatedCost && (
          <div className="flex items-center justify-between text-sm mb-4">
            <span className="text-gray-600">Budget:</span>
            <span className="font-medium text-gray-900">${trip.estimatedCost}</span>
          </div>
        )}

        {/* Trip Footer */}
        <div className="flex items-center justify-between">
          <button 
            className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            onClick={onView}
          >
            View Trip
          </button>
          
          {trip.rating && (
            <div className="flex items-center text-yellow-500">
              <Star size={14} fill="currentColor" className="mr-1" />
              <span className="text-sm font-medium">{trip.rating}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ElegantDashboard; 