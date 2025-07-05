import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { authApi } from '../services/api';
import { toast } from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [loading, setLoading] = useState(true);

  const verifyToken = useCallback(async () => {
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await authApi.getProfile(token);
      console.log('🔍 Token verification response:', response);
      
      if (response.success) {
        // Server returns user data directly, not wrapped in { user: ... }
        setUser(response.data);
        setIsAuthenticated(true);
        localStorage.setItem('token', token); // Refresh token in local storage
        console.log('✅ Token verified, user:', response.data);
      } else {
        console.error('❌ Token verification failed:', response.error);
        throw new Error(response.error || 'Token verification failed');
      }
    } catch (err) {
      console.error('Token verification error:', err);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      toast.error('Session expired. Please log in again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      console.log('🔑 Attempting login for:', email);
      
      const response = await authApi.login({ email, password });
      console.log('📡 Login response:', response);
      
      if (response.success) {
        // The server returns { token, user } directly in response.data
        const { token: newToken, user: userData } = response.data;
        console.log('✅ Login successful, token:', newToken ? 'received' : 'missing');
        console.log('👤 User data:', userData);
        
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        setIsAuthenticated(true);
        toast.success('Logged in successfully!');
        return { success: true };
      } else {
        console.error('❌ Login failed:', response.error);
        throw new Error(response.error || 'Login failed');
      }
    } catch (err) {
      console.error('💥 Login error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Login failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      console.log('📝 Attempting registration for:', userData.email);
      
      const response = await authApi.register(userData);
      console.log('📡 Registration response:', response);
      
      if (response.success) {
        // The server returns { token, user } directly in response.data
        const { token: newToken, user: newUserData } = response.data;
        console.log('✅ Registration successful, token:', newToken ? 'received' : 'missing');
        console.log('👤 User data:', newUserData);
        
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUserData);
        setIsAuthenticated(true);
        toast.success('Account created and logged in!');
        return { success: true };
      } else {
        console.error('❌ Registration failed:', response.error);
        throw new Error(response.error || 'Registration failed');
      }
    } catch (err) {
      console.error('💥 Registration error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Registration failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully!');
  };

  const updateProfile = async (updates) => {
    try {
      setLoading(true);
      const response = await authApi.updateProfile(updates, token);
      if (response.success) {
        // Server returns updated user data directly
        setUser(response.data.user || response.data);
        toast.success('Profile updated successfully!');
        return { success: true };
      } else {
        throw new Error(response.error || 'Profile update failed');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      toast.error(err.response?.data?.message || err.error || 'Profile update failed.');
      return { success: false, error: err.response?.data?.message || err.error };
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      setLoading(true);
      // Assuming updateProfile can handle onboardingComplete field
      const response = await authApi.updateProfile({ onboardingComplete: true }, token);
      if (response.success) {
        // Server returns updated user data directly
        setUser(response.data.user || response.data); // Update user state with onboardingComplete: true
        toast.success('Onboarding complete!');
        return { success: true };
      } else {
        throw new Error(response.error || 'Failed to complete onboarding');
      }
    } catch (err) {
      console.error('Complete onboarding error:', err);
      toast.error(err.response?.data?.message || err.error || 'Failed to complete onboarding.');
      return { success: false, error: err.response?.data?.message || err.error };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateProfile,
    completeOnboarding,
    verifyToken // Expose verifyToken for manual refresh if needed
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 