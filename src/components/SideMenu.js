import React from 'react';
import { motion } from 'framer-motion';
import { X, Menu, Home, Map, Search, Info, Settings } from 'lucide-react';
import './SideMenu.css';

const SideMenu = ({ isOpen, toggleMenu, onNavigate, onSearchClick }) => {
  return (
    <motion.div
      className="sidemenu-container"
      initial={false}
      animate={isOpen ? "open" : "closed"}
      variants={{
        open: { x: "0%" },
        closed: { x: "-100%" }
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <button className="close-btn" onClick={toggleMenu}>
        <X size={24} />
      </button>
      <nav className="sidemenu-nav">
        <ul>
          <li onClick={() => { onNavigate('planner'); toggleMenu(); }}>
            <Home size={20} />
            <span>Home</span>
          </li>
          <li onClick={() => { onNavigate('itinerary'); toggleMenu(); }}>
            <Map size={20} />
            <span>View Itinerary</span>
          </li>
          <li onClick={() => { onSearchClick(); toggleMenu(); }}>
            <Search size={20} />
            <span>Search Trips</span>
          </li>
          <li onClick={() => { onNavigate('practical'); toggleMenu(); }}>
            <Info size={20} />
            <span>Practical Info</span>
          </li>
          <li>
            <Settings size={20} />
            <span>Settings</span>
          </li>
        </ul>
      </nav>
    </motion.div>
  );
};

export default SideMenu; 