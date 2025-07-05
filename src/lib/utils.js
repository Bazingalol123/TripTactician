import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format date utilities
export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

export function formatTime(time) {
  if (!time) return '';
  // Handle various time formats (HH:MM, H:MM AM/PM, etc.)
  const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i;
  const match = time.match(timeRegex);
  
  if (match) {
    let [, hours, minutes, ampm] = match;
    hours = parseInt(hours);
    
    if (ampm) {
      // 12-hour format
      return `${hours}:${minutes} ${ampm.toUpperCase()}`;
    } else {
      // 24-hour format - convert to 12-hour
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${displayHours}:${minutes} ${period}`;
    }
  }
  
  return time; // Return original if no match
}

// Currency utilities
export function formatCurrency(amount, currency = 'USD') {
  if (!amount || isNaN(amount)) return '';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function parseCurrency(currencyString) {
  if (!currencyString) return 0;
  
  // Remove currency symbols and extract numbers
  const cleaned = currencyString.replace(/[^0-9.,]/g, '');
  const number = parseFloat(cleaned.replace(',', ''));
  
  return isNaN(number) ? 0 : number;
}

// Trip utilities
export function calculateTripDuration(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

export function getTripStatus(startDate, endDate) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (now < start) return 'upcoming';
  if (now > end) return 'completed';
  return 'in-progress';
}

export function calculateProgress(completed, total) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

// Activity utilities
export function getActivityIcon(category) {
  const icons = {
    restaurant: '🍽️',
    attraction: '🏛️',
    park: '🌳',
    culture: '🎨',
    shopping: '🛍️',
    entertainment: '🎭',
    museum: '🏺',
    transport: '🚌',
    food: '🍽️',
    nightlife: '🎉',
    hotel: '🏨',
    activity: '⚡',
    sightseeing: '👁️',
    default: '📍'
  };
  
  return icons[category?.toLowerCase()] || icons.default;
}

export function getActivityColor(category) {
  const colors = {
    restaurant: 'bg-orange-100 text-orange-800',
    attraction: 'bg-blue-100 text-blue-800',
    park: 'bg-green-100 text-green-800',
    culture: 'bg-purple-100 text-purple-800',
    shopping: 'bg-pink-100 text-pink-800',
    entertainment: 'bg-yellow-100 text-yellow-800',
    museum: 'bg-indigo-100 text-indigo-800',
    transport: 'bg-gray-100 text-gray-800',
    food: 'bg-orange-100 text-orange-800',
    nightlife: 'bg-red-100 text-red-800',
    hotel: 'bg-blue-100 text-blue-800',
    default: 'bg-gray-100 text-gray-800'
  };
  
  return colors[category?.toLowerCase()] || colors.default;
}

// Validation utilities
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password) {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

// Local storage utilities
export function getFromStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage:`, error);
    return defaultValue;
  }
}

export function setToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage:`, error);
    return false;
  }
}

export function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage:`, error);
    return false;
  }
}

// Debounce utility
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle utility
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Generate unique ID
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Sleep utility
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
} 