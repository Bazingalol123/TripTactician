import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tripsApi, activitiesApi } from '../services/api';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const TripContext = createContext();

export const TripProvider = ({ children }) => {
  const { token, user, isAuthenticated } = useAuth();
  const [trips, setTrips] = useState([]);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [userTrips, setUserTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [error, setError] = useState(null);
  const [draftTrip, setDraftTrip] = useState(() => {
    const saved = localStorage.getItem('draftTrip');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (isAuthenticated && token) {
      loadUserTrips();
    } else if (!isAuthenticated) {
      setUserTrips([]);
      setCurrentTrip(null);
      setLoadingTrips(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (draftTrip) {
      localStorage.setItem('draftTrip', JSON.stringify(draftTrip));
    } else {
      localStorage.removeItem('draftTrip');
    }
  }, [draftTrip]);

  const loadUserTrips = useCallback(async () => {
    setLoadingTrips(true);
    try {
      const response = await fetch('/api/trips', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserTrips(data.trips || []);
      }
    } catch (error) {
      console.error('Failed to load trips:', error);
      toast.error('Failed to load your trips');
    } finally {
      setLoadingTrips(false);
    }
  }, [token]);

  const fetchTripById = useCallback(async (tripId) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentTrip(data.trip);
        return { success: true, trip: data.trip };
      } else {
        const errorData = await response.json();
        
        if (response.status === 429) {
          toast.error('Too many requests. Please wait a moment before trying again.');
          return { success: false, error: 'Rate limited' };
        } else if (response.status === 404) {
          toast.error('Trip not found');
          return { success: false, error: 'Trip not found' };
        } else if (response.status === 400) {
          toast.error('Invalid trip ID');
          return { success: false, error: 'Invalid trip ID' };
        } else {
          throw new Error(errorData.error || 'Failed to load trip');
        }
      }
    } catch (error) {
      console.error('Failed to fetch trip:', error);
      if (error.message !== 'Rate limited' && error.message !== 'Trip not found') {
        toast.error('Failed to load trip details');
      }
      return { success: false, error: error.message };
    }
  }, [token]);

  const createNewTrip = useCallback(async (tripData) => {
    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tripData)
      });

      const data = await response.json();

      if (response.ok) {
        // Add to user trips list
        setUserTrips(prev => [data.trip, ...prev]);
        setCurrentTrip(data.trip);
        
        // Clear draft trip after successful creation
        setDraftTrip(null);
        
        return { success: true, trip: data.trip };
      } else {
        throw new Error(data.error || 'Failed to create trip');
      }
    } catch (error) {
      console.error('Trip creation failed:', error);
      return { success: false, error: error.message };
    }
  }, [token, setDraftTrip]);

  const updateExistingTrip = useCallback(async (tripId, updates) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (response.ok) {
        // Update in user trips list
        setUserTrips(prev => prev.map(trip => 
          trip._id === tripId ? data.trip : trip
        ));
        
        // Update current trip if it's the same
        if (currentTrip?._id === tripId) {
          setCurrentTrip(data.trip);
        }
        
        return { success: true, trip: data.trip };
      } else {
        throw new Error(data.error || 'Failed to update trip');
      }
    } catch (error) {
      console.error('Trip update failed:', error);
      return { success: false, error: error.message };
    }
  }, [token, currentTrip]);

  const deleteExistingTrip = useCallback(async (tripId) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Remove from user trips list
        setUserTrips(prev => prev.filter(trip => trip._id !== tripId));
        
        // Clear current trip if it's the deleted one
        if (currentTrip?._id === tripId) {
          setCurrentTrip(null);
        }
        
        return { success: true };
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete trip');
      }
    } catch (error) {
      console.error('Trip deletion failed:', error);
      return { success: false, error: error.message };
    }
  }, [token, currentTrip]);

  // ✅ FIXED: Activity completion logic with proper ID handling
  const markActivityCompleted = async (activityId, tripId, dayIndex, activityIndex, completed = true, rating = 0, notes = '') => {
    try {
      if (!currentTrip || !currentTrip.dailyItineraries) {
        throw new Error('No trip data available');
      }

      // Create a deep copy of the current trip
      const updatedTrip = JSON.parse(JSON.stringify(currentTrip));
      
      // Find and update the specific activity
      if (updatedTrip.dailyItineraries[dayIndex] && 
          updatedTrip.dailyItineraries[dayIndex].activities[activityIndex]) {
        
        const activity = updatedTrip.dailyItineraries[dayIndex].activities[activityIndex];
        
        // Verify this is the correct activity (by ID if available, or by index)
        if (activityId && activity._id && activity._id !== activityId) {
          throw new Error('Activity ID mismatch');
        }
        
        // Update activity completion status
        activity.completed = completed;
        activity.rating = rating;
        activity.notes = notes;
        activity.completedAt = completed ? new Date() : null;
        
        // Save the updated trip to the backend
        const updateResult = await updateExistingTrip(tripId, {
          dailyItineraries: updatedTrip.dailyItineraries
        });
        
        if (updateResult.success) {
          // Update local state
          setCurrentTrip(updateResult.trip);
          return { success: true };
        } else {
          throw new Error(updateResult.error || 'Failed to update trip');
        }
      } else {
        throw new Error('Activity not found at specified location');
      }
    } catch (err) {
      console.error('Failed to mark activity completed:', err);
      return { success: false, error: err.message };
    }
  };

  // ✅ NEW: Batch update activities for better performance
  const updateMultipleActivities = async (tripId, updates) => {
    try {
      if (!currentTrip) {
        throw new Error('No current trip loaded');
      }

      const updatedTrip = JSON.parse(JSON.stringify(currentTrip));
      
      updates.forEach(update => {
        const { dayIndex, activityIndex, changes } = update;
        if (updatedTrip.dailyItineraries[dayIndex] && 
            updatedTrip.dailyItineraries[dayIndex].activities[activityIndex]) {
          Object.assign(updatedTrip.dailyItineraries[dayIndex].activities[activityIndex], changes);
        }
      });

      const result = await updateExistingTrip(tripId, {
        dailyItineraries: updatedTrip.dailyItineraries
      });

      return result;
    } catch (err) {
      console.error('Failed to update multiple activities:', err);
      return { success: false, error: err.message };
    }
  };

  // ✅ NEW: Add activity to existing trip
  const addActivityToTrip = async (tripId, dayIndex, newActivity) => {
    try {
      if (!currentTrip) {
        throw new Error('No current trip loaded');
      }

      const updatedTrip = JSON.parse(JSON.stringify(currentTrip));
      
      if (!updatedTrip.dailyItineraries[dayIndex]) {
        throw new Error('Day not found');
      }

      updatedTrip.dailyItineraries[dayIndex].activities.push(newActivity);

      const result = await updateExistingTrip(tripId, {
        dailyItineraries: updatedTrip.dailyItineraries
      });

      return result;
    } catch (err) {
      console.error('Failed to add activity:', err);
      return { success: false, error: err.message };
    }
  };

  // ✅ NEW: Remove activity from trip
  const removeActivityFromTrip = async (tripId, dayIndex, activityIndex) => {
    try {
      if (!currentTrip) {
        throw new Error('No current trip loaded');
      }

      const updatedTrip = JSON.parse(JSON.stringify(currentTrip));
      
      if (!updatedTrip.dailyItineraries[dayIndex] || 
          !updatedTrip.dailyItineraries[dayIndex].activities[activityIndex]) {
        throw new Error('Activity not found');
      }

      updatedTrip.dailyItineraries[dayIndex].activities.splice(activityIndex, 1);

      const result = await updateExistingTrip(tripId, {
        dailyItineraries: updatedTrip.dailyItineraries
      });

      return result;
    } catch (err) {
      console.error('Failed to remove activity:', err);
      return { success: false, error: err.message };
    }
  };

  // ✅ NEW: Calculate trip statistics
  const getTripStatistics = (trip = currentTrip) => {
    if (!trip || !trip.dailyItineraries) {
      return {
        totalDays: 0,
        totalActivities: 0,
        completedActivities: 0,
        progressPercentage: 0,
        estimatedCost: 0,
        actualCost: 0
      };
    }

    let totalActivities = 0;
    let completedActivities = 0;
    let estimatedCost = 0;

    trip.dailyItineraries.forEach(day => {
      if (day.activities) {
        totalActivities += day.activities.length;
        completedActivities += day.activities.filter(activity => activity.completed).length;
        
        day.activities.forEach(activity => {
          if (activity.cost) {
            const cost = parseFloat(activity.cost.replace(/[^0-9.]/g, ''));
            if (!isNaN(cost)) {
              estimatedCost += cost;
            }
          }
        });
      }
    });

    return {
      totalDays: trip.dailyItineraries.length,
      totalActivities,
      completedActivities,
      progressPercentage: totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0,
      estimatedCost,
      actualCost: trip.actualCost || 0
    };
  };

  const value = {
    trips,
    setTrips,
    currentTrip,
    setCurrentTrip,
    userTrips,
    loadingTrips,
    error,
    draftTrip,
    setDraftTrip,
    loadUserTrips,
    fetchTripById,
    createNewTrip,
    updateExistingTrip,
    deleteExistingTrip,
    markActivityCompleted,
    updateMultipleActivities,
    addActivityToTrip,
    removeActivityFromTrip,
    getTripStatistics
  };

  return (
    <TripContext.Provider value={value}>
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => useContext(TripContext); 