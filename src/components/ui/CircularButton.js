import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const CircularButton = ({ 
  children, 
  className, 
  variant = 'default', 
  size = 'md', 
  onClick,
  disabled = false,
  loading = false,
  ...props 
}) => {
  const variants = {
    default: 'bg-primary text-white hover:bg-primary/90 border-primary',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-secondary',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
    ghost: 'text-primary hover:bg-primary/10 border-transparent',
    gradient: 'bg-gradient-to-r from-primary to-blue-600 text-white hover:from-primary/90 hover:to-blue-600/90 border-transparent',
    success: 'bg-green-500 text-white hover:bg-green-600 border-green-500',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-500',
    danger: 'bg-red-500 text-white hover:bg-red-600 border-red-500'
  };

  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-xl'
  };

  return (
    <motion.button
      className={cn(
        // Base styles
        'relative rounded-full border transition-all duration-200 ease-in-out',
        'flex items-center justify-center',
        'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'shadow-md hover:shadow-lg active:shadow-sm',
        // Size and variant styles
        sizes[size],
        variants[variant],
        className
      )}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      {...props}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      ) : (
        children
      )}
      
      {/* Ripple effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-white/20"
        initial={{ scale: 0, opacity: 0 }}
        whileTap={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.1 }}
      />
    </motion.button>
  );
};

export default CircularButton; 