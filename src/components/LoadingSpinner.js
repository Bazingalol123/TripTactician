import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plane, Compass, Star } from 'lucide-react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ message = "Creating your perfect itinerary..." }) => {
  return (
    <motion.div
      className="loading-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="loading-content">
        {/* Main Spinner */}
        <div className="spinner-container">
          <motion.div
            className="spinner-ring"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="spinner-ring"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="spinner-ring"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Center Icon */}
          <motion.div
            className="center-icon"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Plane size={32} />
          </motion.div>
        </div>

        {/* Floating Elements */}
        <div className="floating-elements">
          <motion.div
            className="floating-element map-pin"
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <MapPin size={20} />
          </motion.div>
          
          <motion.div
            className="floating-element compass"
            animate={{
              y: [20, -20, 20],
              x: [10, -10, 10],
              rotate: [0, -10, 10, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Compass size={18} />
          </motion.div>
          
          <motion.div
            className="floating-element star"
            animate={{
              y: [-15, 15, -15],
              x: [15, -15, 15],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Star size={16} />
          </motion.div>
        </div>

        {/* Loading Text */}
        <motion.div
          className="loading-text"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <h3>{message}</h3>
          <div className="loading-dots">
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            />
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            />
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          className="progress-container"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, ease: "easeInOut" }}
            />
          </div>
          <div className="progress-steps">
            <motion.div
              className="step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <span className="step-icon">🌍</span>
              <span className="step-text">Analyzing destination</span>
            </motion.div>
            <motion.div
              className="step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <span className="step-icon">🎯</span>
              <span className="step-text">Finding attractions</span>
            </motion.div>
            <motion.div
              className="step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.5, duration: 0.5 }}
            >
              <span className="step-icon">🗺️</span>
              <span className="step-text">Mapping routes</span>
            </motion.div>
            <motion.div
              className="step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2, duration: 0.5 }}
            >
              <span className="step-icon">✨</span>
              <span className="step-text">Finalizing itinerary</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoadingSpinner; 