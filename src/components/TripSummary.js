import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, DollarSign, Cloud, Clock, Users } from 'lucide-react';
import './TripSummary.css';

const TripSummary = ({ itinerary }) => {
  const { destination, tripSummary, dailyItineraries, practicalInfo, recommendations } = itinerary;

  const summaryCards = [
    {
      icon: Calendar,
      title: 'Duration',
      value: tripSummary.duration,
      color: '#667eea'
    },
    {
      icon: DollarSign,
      title: 'Budget Estimate',
      value: tripSummary.budgetEstimate,
      color: '#10b981'
    },
    {
      icon: Clock,
      title: 'Best Time',
      value: tripSummary.bestTimeToVisit,
      color: '#8b5cf6'
    }
  ];

  return (
    <div className="trip-summary">
      <motion.div 
        className="summary-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Your Trip to {destination}</h2>
        <p className="summary-subtitle">Here's what we've planned for your perfect adventure</p>
      </motion.div>

      <div className="summary-grid">
        {summaryCards.map((card, index) => (
          <motion.div
            key={index}
            className="summary-card"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="card-icon" style={{ backgroundColor: card.color }}>
              <card.icon className="icon" />
            </div>
            <div className="card-content">
              <h3>{card.title}</h3>
              <p>{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="summary-sections">
        <motion.div 
          className="summary-section"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3>🎯 Trip Overview</h3>
          <div className="overview-content">
            <div className="overview-item">
              <strong>Destination:</strong> {destination}
            </div>
            <div className="overview-item">
              <strong>Total Days:</strong> {dailyItineraries.length}
            </div>
            <div className="overview-item">
              <strong>Total Activities:</strong> {dailyItineraries.reduce((total, day) => total + day.activities.length, 0)}
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="summary-section"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3>⭐ Must-See Highlights</h3>
          <div className="highlights-grid">
            {recommendations.mustSee.slice(0, 6).map((item, index) => (
              <motion.div
                key={index}
                className="highlight-item"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
              >
                <span className="highlight-icon">📍</span>
                {item}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          className="summary-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h3>🍽️ Local Cuisine to Try</h3>
          <div className="food-grid">
            {recommendations.food.slice(0, 4).map((food, index) => (
              <motion.div
                key={index}
                className="food-item"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
              >
                <span className="food-icon">🍴</span>
                {food}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          className="summary-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <h3>💡 Travel Tips</h3>
          <div className="tips-grid">
            <div className="tip-item">
              <strong>Best Time to Visit:</strong> {practicalInfo.bestTimeToVisit}
            </div>
            <div className="tip-item">
              <strong>Transportation:</strong> {practicalInfo.transportation}
            </div>
            <div className="tip-item">
              <strong>Accommodation:</strong> {practicalInfo.accommodation}
            </div>
            <div className="tip-item">
              <strong>Safety:</strong> {practicalInfo.safety}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div 
        className="summary-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <p>✨ Your personalized itinerary is ready! Explore the tabs above to see detailed daily plans, recommendations, and practical information.</p>
      </motion.div>
    </div>
  );
};

export default TripSummary; 