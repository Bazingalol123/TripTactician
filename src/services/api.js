const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// Helper function for API calls
const callApi = async (method, url, data = null, token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : null,
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || result.message || 'An error occurred' };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error(`API Call Error (${method} ${url}):`, error);
    return { success: false, error: 'Network error or unexpected response' };
  }
};

// Auth API
export const authApi = {
  register: async (userData) => callApi('POST', '/auth/register', userData),
  login: async (credentials) => callApi('POST', '/auth/login', credentials),
  verifyEmail: async (token) => callApi('GET', `/auth/verify-email/${token}`),
  forgotPassword: async (email) => callApi('POST', '/auth/forgot-password', { email }),
  resetPassword: async (token, newPassword) => callApi('PUT', `/auth/reset-password/${token}`, { newPassword }),
  getProfile: async (token) => callApi('GET', '/auth/me', null, token),
  updateProfile: async (profileData, token) => callApi('PUT', '/auth/profile', profileData, token),
};

// Trips API
export const tripsApi = (token) => ({
  getAll: async () => {
    const response = await callApi('GET', '/trips', null, token);
    return response.success ? response.data : { error: response.error };
  },
  get: async (id) => {
    const response = await callApi('GET', `/trips/${id}`, null, token);
    return response.success ? response.data : { error: response.error };
  },
  create: async (tripData) => {
    const response = await callApi('POST', '/trips', tripData, token);
    return response.success ? { success: true, trip: response.data } : { success: false, error: response.error };
  },
  update: async (id, updates) => {
    const response = await callApi('PUT', `/trips/${id}`, updates, token);
    return response.success ? { success: true, trip: response.data } : { success: false, error: response.error };
  },
  remove: async (id) => {
    const response = await callApi('DELETE', `/trips/${id}`, null, token);
    return response.success ? { success: true } : { success: false, error: response.error };
  },
  
  // NEW: Trip editing with recommendations
  addRecommendation: async (tripId, dayIndex, recommendation, insertIndex = -1) => {
    const response = await callApi('POST', `/trips/${tripId}/add-recommendation`, {
      dayIndex,
      recommendation,
      insertIndex
    }, token);
    return response.success ? { success: true, trip: response.data } : { success: false, error: response.error };
  },
  
  replaceActivity: async (tripId, dayIndex, activityIndex, recommendation) => {
    const response = await callApi('PUT', `/trips/${tripId}/replace-activity`, {
      dayIndex,
      activityIndex,
      recommendation
    }, token);
    return response.success ? { success: true, trip: response.data } : { success: false, error: response.error };
  },
  
  removeActivity: async (tripId, dayIndex, activityIndex) => {
    const response = await callApi('DELETE', `/trips/${tripId}/remove-activity`, {
      dayIndex,
      activityIndex
    }, token);
    return response.success ? { success: true, trip: response.data } : { success: false, error: response.error };
  },
  
  reorderActivities: async (tripId, dayIndex, fromIndex, toIndex) => {
    const response = await callApi('PUT', `/trips/${tripId}/reorder-activities`, {
      dayIndex,
      fromIndex,
      toIndex
    }, token);
    return response.success ? { success: true, trip: response.data } : { success: false, error: response.error };
  }
});

// Activities API
export const activitiesApi = (token) => ({
  create: async (activityData) => {
    const response = await callApi('POST', '/activities', activityData, token);
    return response.success ? { success: true, activity: response.data } : { success: false, error: response.error };
  },
  get: async (id) => {
    const response = await callApi('GET', `/activities/${id}`, null, token);
    return response.success ? response.data : { error: response.error };
  },
  update: async (id, updates) => {
    const response = await callApi('PUT', `/activities/${id}`, updates, token);
    return response.success ? { success: true, activity: response.data } : { success: false, error: response.error };
  },
  remove: async (id) => {
    const response = await callApi('DELETE', `/activities/${id}`, null, token);
    return response.success ? { success: true } : { success: false, error: response.error };
  },
});

// Memories API
export const memoriesApi = (token) => ({
  create: async (memoryData) => {
    const response = await callApi('POST', '/memories', memoryData, token);
    return response.success ? { success: true, memory: response.data } : { success: false, error: response.error };
  },
  get: async (id) => {
    const response = await callApi('GET', `/memories/${id}`, null, token);
    return response.success ? response.data : { error: response.error };
  },
  getAllUserMemories: async () => {
    const response = await callApi('GET', '/memories', null, token);
    return response.success ? response.data : { error: response.error };
  },
  update: async (id, updates) => {
    const response = await callApi('PUT', `/memories/${id}`, updates, token);
    return response.success ? { success: true, memory: response.data } : { success: false, error: response.error };
  },
  remove: async (id) => {
    const response = await callApi('DELETE', `/memories/${id}`, null, token);
    return response.success ? { success: true } : { success: false, error: response.error };
  },
});

// Buddy Messages API
export const buddyMessagesApi = (token) => ({
  create: async (messageData) => {
    const response = await callApi('POST', '/buddymessages', messageData, token);
    return response.success ? { success: true, message: response.data } : { success: false, error: response.error };
  },
  getByTrip: async (tripId) => {
    const response = await callApi('GET', `/buddymessages/trip/${tripId}`, null, token);
    return response.success ? response.data : { error: response.error };
  },
});

// Friendship API
export const friendshipsApi = (token) => ({
  sendRequest: async (userId) => {
    const response = await callApi('POST', '/friendships/request', { userId }, token);
    return response.success ? { success: true, friendship: response.data } : { success: false, error: response.error };
  },
  acceptRequest: async (requestId) => {
    const response = await callApi('PUT', `/friendships/accept/${requestId}`, null, token);
    return response.success ? { success: true, friendship: response.data } : { success: false, error: response.error };
  },
  rejectRequest: async (requestId) => {
    const response = await callApi('PUT', `/friendships/reject/${requestId}`, null, token);
    return response.success ? { success: true } : { success: false, error: response.error };
  },
  removeFriend: async (friendshipId) => {
    const response = await callApi('DELETE', `/friendships/${friendshipId}`, null, token);
    return response.success ? { success: true } : { success: false, error: response.error };
  },
  getAll: async () => {
    const response = await callApi('GET', '/friendships', null, token);
    return response.success ? response.data : { error: response.error };
  },
});

// NEW UNIFIED TRIP GENERATOR - Combines Smart Recommendations + AI Structuring
export const generateUnifiedTrip = async (tripData) => {
  try {
    console.log('🚀 Calling unified trip generation API:', tripData);
    
    const response = await fetch(`${API_BASE_URL}/generate-unified-trip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(tripData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate unified trip');
    }

    const data = await response.json();
    
    console.log('✅ Unified trip generated successfully:', data.stats);
    
    return {
      success: true,
      trip: data.trip,
      message: data.message,
      stats: data.stats
    };
  } catch (error) {
    console.error('❌ Unified trip generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate trip using real Google Places data
export const generateRealDataTrip = async (tripData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-real-trip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(tripData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate trip with real data');
    }

    const data = await response.json();
    return {
      success: true,
      trip: data.trip,
      message: data.message,
      dataSource: data.dataSource
    };
  } catch (error) {
    console.error('Real data trip generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Smart trip recommendations API
export const getSmartRecommendations = async (destination, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/smart-recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        destination,
        ...options
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get smart recommendations');
    }

    const data = await response.json();
    return {
      success: true,
      data: data.data,
      message: data.message
    };
  } catch (error) {
    console.error('Smart recommendations error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Car rental search API
export const searchCarRentals = async (destination, pickupDate, returnDate, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/car-rentals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        destination,
        pickupDate,
        returnDate,
        ...options
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to search car rentals');
    }

    const data = await response.json();
    return {
      success: true,
      rentals: data.rentals,
      message: data.message
    };
  } catch (error) {
    console.error('Car rental search error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}; 