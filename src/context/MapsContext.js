import React, { createContext, useContext, useState, useEffect } from 'react';

const MapsContext = createContext();

export const MapsProvider = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(true); // Always available with free maps
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    console.log('🗺️ Free Maps Provider initialized');
    console.log('✅ Using OpenStreetMap (completely free!)');
  }, []);

  const contextValue = {
    isLoaded,
    loadError: null // No errors with free maps
  };

  return (
    <MapsContext.Provider value={contextValue}>
      {children}
    </MapsContext.Provider>
  );
};

export const useMaps = () => {
  const context = useContext(MapsContext);
  if (context === undefined) {
    throw new Error('useMaps must be used within a MapsProvider');
  }
  return context;
};

export default MapsContext; 