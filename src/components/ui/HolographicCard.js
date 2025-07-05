import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import './HolographicCard.css';

const HolographicCard = ({ 
  children, 
  className = '', 
  variant = 'default',
  glow = false,
  interactive = true,
  ...props 
}) => {
  const variants = {
    default: 'holographic-card',
    ghost: 'holographic-card-ghost',
    solid: 'holographic-card-solid',
    glow: 'holographic-card-glow'
  };

  return (
    <motion.div
      className={cn(
        variants[variant],
        glow && 'with-glow',
        interactive && 'interactive',
        className
      )}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      whileHover={interactive ? { 
        scale: 1.02,
        boxShadow: '0 20px 40px rgba(6, 182, 212, 0.2)',
        borderColor: 'rgba(6, 182, 212, 0.5)'
      } : undefined}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      }}
      {...props}
    >
      <div className="holographic-content">
        {children}
      </div>
      
      {/* Holographic overlay effects */}
      <div className="holographic-overlay" />
      <div className="holographic-border" />
      
      {glow && <div className="holographic-glow" />}
    </motion.div>
  );
};

export default HolographicCard; 