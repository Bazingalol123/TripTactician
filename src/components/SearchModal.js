import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import './SearchModal.css';

const SearchModal = ({ isOpen, onClose, onSearchSubmit }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearchSubmit(searchTerm);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-content"
            initial={{ y: "-100vh", opacity: 0 }}
            animate={{ y: "0", opacity: 1 }}
            exit={{ y: "100vh", opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 10 }}
            onClick={(e) => e.stopPropagation()} // Prevent backdrop click from closing modal
          >
            <button className="modal-close-btn" onClick={onClose}>
              <X size={24} />
            </button>
            <h2 className="modal-title">Search for Trips</h2>
            <form className="search-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <Search className="input-icon" />
                <input
                  type="text"
                  placeholder="Enter destination or trip idea..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="search-button">Search</button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchModal; 