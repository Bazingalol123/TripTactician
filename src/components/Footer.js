import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Github, Twitter, Mail } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <motion.div 
          className="footer-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3>TripTactician Pro</h3>
          <p>AI-powered travel planning for the modern adventurer</p>
        </motion.div>

        <motion.div 
          className="footer-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h4>Features</h4>
          <ul>
            <li>AI-Powered Itinerary Generation</li>
            <li>Google Maps Integration</li>
            <li>Local Attractions & Activities</li>
            <li>Personalized Recommendations</li>
            <li>Travel Tips & Practical Info</li>
          </ul>
        </motion.div>

        <motion.div 
          className="footer-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h4>Connect</h4>
          <div className="social-links">
            <a href="#" className="social-link">
              <Github className="social-icon" />
            </a>
            <a href="#" className="social-link">
              <Twitter className="social-icon" />
            </a>
            <a href="#" className="social-link">
              <Mail className="social-icon" />
            </a>
          </div>
        </motion.div>
      </div>

      <motion.div 
        className="footer-bottom"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <p>
          Made with <Heart className="heart-icon" /> by the TripTactician Team
        </p>
        <p>&copy; 2024 TripTactician Pro. All rights reserved.</p>
      </motion.div>
    </footer>
  );
};

export default Footer; 