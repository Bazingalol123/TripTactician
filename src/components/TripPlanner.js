import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { MapPin, Calendar, Users, DollarSign, Home, Heart, Bot, MessageCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import AIConversation from './AIConversation';
import 'react-datepicker/dist/react-datepicker.css';
import './TripPlanner.css';

const TripPlanner = ({ onGenerateItinerary }) => {
  const [planningMode, setPlanningMode] = useState('form'); // 'form' or 'ai'
  const [formData, setFormData] = useState({
    destination: '',
    startDate: null,
    endDate: null,
    interests: [],
    budget: '',
    groupSize: '',
    accommodationType: '',
    travelStyle: '',
    specialRequirements: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const interestOptions = [
    { value: 'Museums', label: 'Museums & Culture', icon: '🏛️' },
    { value: 'Food', label: 'Food & Dining', icon: '🍽️' },
    { value: 'Hiking', label: 'Hiking & Nature', icon: '🏔️' },
    { value: 'Shopping', label: 'Shopping', icon: '🛍️' },
    { value: 'Nightlife', label: 'Nightlife', icon: '🌙' },
    { value: 'History', label: 'Historical Sites', icon: '🏺' },
    { value: 'Art', label: 'Art & Galleries', icon: '🎨' },
    { value: 'Adventure', label: 'Adventure Sports', icon: '🏄‍♂️' },
    { value: 'Relaxation', label: 'Relaxation & Spa', icon: '🧘‍♀️' },
    { value: 'Photography', label: 'Photography', icon: '📸' }
  ];

  const budgetOptions = [
    { value: 'budget', label: 'Budget ($50-100/day)' },
    { value: 'moderate', label: 'Moderate ($100-200/day)' },
    { value: 'luxury', label: 'Luxury ($200+/day)' },
    { value: 'flexible', label: 'Flexible' }
  ];

  const groupSizeOptions = [
    { value: '1', label: 'Solo Traveler' },
    { value: '2', label: 'Couple' },
    { value: '3-5', label: 'Small Group (3-5)' },
    { value: '6-10', label: 'Medium Group (6-10)' },
    { value: '10+', label: 'Large Group (10+)' }
  ];

  const accommodationOptions = [
    { value: 'hotel', label: 'Hotel' },
    { value: 'hostel', label: 'Hostel' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'resort', label: 'Resort' },
    { value: 'camping', label: 'Camping' },
    { value: 'flexible', label: 'Flexible' }
  ];

  const travelStyleOptions = [
    { value: 'relaxed', label: 'Relaxed & Slow-paced' },
    { value: 'balanced', label: 'Balanced' },
    { value: 'active', label: 'Active & Fast-paced' },
    { value: 'luxury', label: 'Luxury & Comfort' },
    { value: 'adventure', label: 'Adventure & Thrill' }
  ];

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInterestChange = (selectedOptions) => {
    setFormData(prev => ({
      ...prev,
      interests: selectedOptions.map(option => option.value)
    }));
  };

  const validateForm = () => {
    if (!formData.destination.trim()) {
      toast.error('Please enter a destination');
      return false;
    }
    
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select start and end dates');
      return false;
    }
    
    if (formData.startDate >= formData.endDate) {
      toast.error('End date must be after start date');
      return false;
    }
    
    if (formData.interests.length === 0) {
      toast.error('Please select at least one interest');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const submitData = {
        ...formData,
        startDate: formData.startDate.toISOString().split('T')[0],
        endDate: formData.endDate.toISOString().split('T')[0]
      };
      
      await onGenerateItinerary(submitData);
      toast.success('Itinerary generated successfully!');
    } catch (error) {
      toast.error('Failed to generate itinerary. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAIItineraryUpdate = (updatedItinerary) => {
    onGenerateItinerary(updatedItinerary);
  };

  const createInitialItinerary = () => {
    return {
      destination: formData.destination || 'Your Destination',
      startDate: formData.startDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      endDate: formData.endDate?.toISOString().split('T')[0] || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      interests: formData.interests,
      budget: formData.budget,
      groupSize: formData.groupSize,
      accommodationType: formData.accommodationType,
      travelStyle: formData.travelStyle,
      specialRequirements: formData.specialRequirements,
      dailyItineraries: []
    };
  };

  return (
    <div className="trip-planner">
      {/* Planning Mode Selector */}
      <motion.div 
        className="mode-selector"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h3>Choose Your Planning Style</h3>
        <div className="mode-options">
          <motion.button
            className={`mode-btn ${planningMode === 'form' ? 'active' : ''}`}
            onClick={() => setPlanningMode('form')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Calendar className="mode-icon" />
            <div className="mode-content">
              <h4>Traditional Form</h4>
              <p>Fill out a detailed form with all your preferences</p>
            </div>
          </motion.button>

          <motion.button
            className={`mode-btn ${planningMode === 'ai' ? 'active' : ''}`}
            onClick={() => setPlanningMode('ai')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Bot className="mode-icon" />
            <div className="mode-content">
              <h4>AI Conversation</h4>
              <p>Chat with AI to plan and modify your trip dynamically</p>
            </div>
          </motion.button>
        </div>
      </motion.div>

      {/* AI Conversation Mode */}
      {planningMode === 'ai' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
        >
          <AIConversation 
            onItineraryUpdate={handleAIItineraryUpdate}
            initialItinerary={createInitialItinerary()}
          />
        </motion.div>
      )}

      {/* Traditional Form Mode */}
      {planningMode === 'form' && (
        <motion.div 
          className="planner-card"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="planner-header">
            <h2>Plan Your Dream Trip</h2>
            <p>Tell us about your preferences and we'll create a personalized itinerary</p>
          </div>

          <form onSubmit={handleSubmit} className="planner-form">
            <div className="form-section">
              <h3><MapPin className="icon" /> Destination & Dates</h3>
              
              <div className="form-group">
                <label htmlFor="destination">Where do you want to go? *</label>
                <input
                  type="text"
                  id="destination"
                  value={formData.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  placeholder="e.g., Paris, France or Tokyo, Japan"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <DatePicker
                    selected={formData.startDate}
                    onChange={(date) => handleInputChange('startDate', date)}
                    selectsStart
                    startDate={formData.startDate}
                    endDate={formData.endDate}
                    minDate={new Date()}
                    placeholderText="Select start date"
                    className="date-picker"
                  />
                </div>

                <div className="form-group">
                  <label>End Date *</label>
                  <DatePicker
                    selected={formData.endDate}
                    onChange={(date) => handleInputChange('endDate', date)}
                    selectsEnd
                    startDate={formData.startDate}
                    endDate={formData.endDate}
                    minDate={formData.startDate}
                    placeholderText="Select end date"
                    className="date-picker"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3><Heart className="icon" /> Interests & Preferences</h3>
              
              <div className="form-group">
                <label>What interests you? *</label>
                <Select
                  isMulti
                  options={interestOptions}
                  onChange={handleInterestChange}
                  placeholder="Select your interests..."
                  className="select-container"
                  classNamePrefix="select"
                  formatOptionLabel={(option) => (
                    <div className="option-label">
                      <span className="option-icon">{option.icon}</span>
                      <span>{option.label}</span>
                    </div>
                  )}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Travel Style</label>
                  <Select
                    options={travelStyleOptions}
                    onChange={(option) => handleInputChange('travelStyle', option?.value)}
                    placeholder="Select travel style"
                    className="select-container"
                    classNamePrefix="select"
                  />
                </div>

                <div className="form-group">
                  <label>Group Size</label>
                  <Select
                    options={groupSizeOptions}
                    onChange={(option) => handleInputChange('groupSize', option?.value)}
                    placeholder="Select group size"
                    className="select-container"
                    classNamePrefix="select"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3><DollarSign className="icon" /> Budget & Accommodation</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Budget Range</label>
                  <Select
                    options={budgetOptions}
                    onChange={(option) => handleInputChange('budget', option?.value)}
                    placeholder="Select budget range"
                    className="select-container"
                    classNamePrefix="select"
                  />
                </div>

                <div className="form-group">
                  <label>Accommodation Type</label>
                  <Select
                    options={accommodationOptions}
                    onChange={(option) => handleInputChange('accommodationType', option?.value)}
                    placeholder="Select accommodation"
                    className="select-container"
                    classNamePrefix="select"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="specialRequirements">Special Requirements</label>
                <textarea
                  id="specialRequirements"
                  value={formData.specialRequirements}
                  onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                  placeholder="Any special requirements? (accessibility, dietary restrictions, etc.)"
                  rows="3"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              className="generate-btn"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  Generating Your Itinerary...
                </>
              ) : (
                <>
                  <Calendar className="btn-icon" />
                  Generate AI-Powered Itinerary
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      )}
    </div>
  );
};

export default TripPlanner; 