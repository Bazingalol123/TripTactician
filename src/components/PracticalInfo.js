import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Car, Hotel, DollarSign, Shield, Package } from 'lucide-react';
import './PracticalInfo.css';

const PracticalInfo = ({ practicalInfo = {} }) => {
  const {
    bestTimeToVisit = 'Check local weather patterns',
    transportation = 'Public transport available',
    accommodation = 'Various options available',
    budget = 'Budget varies by preferences',
    safety = 'Standard safety precautions recommended',
    packing = 'Pack according to weather and activities'
  } = practicalInfo;

  const infoSections = [
    {
      title: 'Best Time to Visit',
      content: bestTimeToVisit,
      icon: Calendar,
      color: '#ff6b6b'
    },
    {
      title: 'Transportation',
      content: transportation,
      icon: Car,
      color: '#4ecdc4'
    },
    {
      title: 'Accommodation',
      content: accommodation,
      icon: Hotel,
      color: '#45b7d1'
    },
    {
      title: 'Budget',
      content: budget,
      icon: DollarSign,
      color: '#96ceb4'
    },
    {
      title: 'Safety',
      content: safety,
      icon: Shield,
      color: '#feca57'
    },
    {
      title: 'Packing',
      content: packing,
      icon: Package,
      color: '#ff9ff3'
    }
  ];

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
      className="practical-info"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h2>Practical Information</h2>
      <p className="practical-subtitle">
        Essential information to help you plan and enjoy your trip
      </p>

      <div className="info-grid">
        {infoSections.map((section) => (
          <motion.div
            key={section.title}
            className="info-card"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div className="card-header" style={{ borderLeftColor: section.color }}>
              <section.icon className="card-icon" style={{ color: section.color }} />
              <h3>{section.title}</h3>
            </div>
            <div className="card-content">
              <p>{section.content}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="additional-tips">
        <h3>Additional Travel Tips</h3>
        <div className="tips-container">
          <div className="tip-section">
            <h4>Before You Go</h4>
            <ul>
              <li>Check visa requirements and passport validity</li>
              <li>Research local customs and etiquette</li>
              <li>Get travel insurance</li>
              <li>Download offline maps and translation apps</li>
              <li>Notify your bank about international travel</li>
            </ul>
          </div>
          
          <div className="tip-section">
            <h4>During Your Trip</h4>
            <ul>
              <li>Keep copies of important documents</li>
              <li>Stay hydrated and eat local food safely</li>
              <li>Learn basic phrases in the local language</li>
              <li>Respect local customs and dress codes</li>
              <li>Stay connected with family and friends</li>
            </ul>
          </div>
          
          <div className="tip-section">
            <h4>Emergency Contacts</h4>
            <ul>
              <li>Local emergency services: 911 (US) / 112 (EU)</li>
              <li>Your country's embassy or consulate</li>
              <li>Travel insurance provider</li>
              <li>Hotel front desk</li>
              <li>Local tourist information center</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="weather-note">
        <h4>Weather Considerations</h4>
        <p>
          Weather can significantly impact your travel experience. Check the forecast 
          before your trip and pack accordingly. Consider seasonal events, holidays, 
          and peak tourist seasons when planning your visit.
        </p>
      </div>

      <div className="budget-breakdown">
        <h4>Typical Budget Breakdown</h4>
        <div className="budget-items">
          <div className="budget-item">
            <span className="budget-category">Accommodation</span>
            <span className="budget-percentage">40%</span>
          </div>
          <div className="budget-item">
            <span className="budget-category">Food & Dining</span>
            <span className="budget-percentage">25%</span>
          </div>
          <div className="budget-item">
            <span className="budget-category">Transportation</span>
            <span className="budget-percentage">20%</span>
          </div>
          <div className="budget-item">
            <span className="budget-category">Activities & Entertainment</span>
            <span className="budget-percentage">15%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PracticalInfo; 