import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { TripProvider, useTrip } from './context/TripContext';
import { FreeMapProvider } from './components/FreeMapInterface';
import { AirportsProvider } from './context/AirportsContext';
import { useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

// Components
import ElegantLogin from './components/ElegantLogin';
import TripGenerationScreen from './components/TripGenerationScreen';
import TripViewScreen from './components/TripViewScreen';
import ElegantDashboard from './components/ElegantDashboard';
import MemoriesPage from './components/MemoriesPage';
import FriendshipsPage from './components/FriendshipsPage';
import TripSetupForm from './components/TripSetupForm';
import ElegantTripSetupWizard from './components/ElegantTripSetupWizard';

// Diagnostic Component
import MapDiagnostic from './components/MapDiagnostic';

// Smart Trip Recommendations
import SmartTripRecommendations from './components/SmartTripRecommendations';

// Styles
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #1a1412, #7C3AED22, #1a1412)' }}>
        <div className="flex items-center space-x-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#7C3AED' }}></div>
          <div style={{ color: '#7C3AED', fontFamily: "'DM Serif Display', Georgia, serif" }}>LOADING WAYFARE...</div>
        </div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// Main App Component
function App() {
  return (
    <ErrorBoundary>
      <AirportsProvider>
        <AuthProvider>
          <TripProvider>
            <FreeMapProvider>
              <Router>
                <div className="App">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<ElegantLogin />} />
                    
                    {/* Protected Routes - DEFAULT TO DASHBOARD */}
                    <Route path="/" element={
                      <ProtectedRoute>
                        <ElegantDashboard />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <ElegantDashboard />
                      </ProtectedRoute>
                    } />
                    
                  
                  
                    {/* Trip Setup Routes */}
                    <Route path="/trip-setup" element={
                      <ProtectedRoute>
                        <ElegantTripSetupWizard />
                      </ProtectedRoute>
                    } />
                    
                    {/* Backward compatibility for /setup */}
                    <Route path="/setup" element={
                      <ProtectedRoute>
                        <TripSetupForm />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/trip-generation" element={
                      <ProtectedRoute>
                        <TripGenerationScreen />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/trip/:tripId" element={
                      <ProtectedRoute>
                        <TripViewScreen />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/memories" element={
                      <ProtectedRoute>
                        <MemoriesPage />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/friends" element={
                      <ProtectedRoute>
                        <FriendshipsPage />  
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/recommendations" element={
                      <ProtectedRoute>
                        <SmartTripRecommendations />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/map-diagnostic" element={
                      <ProtectedRoute>
                        <MapDiagnostic />
                      </ProtectedRoute>
                    } />
                    
                    {/* Catch all route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                  
                  {/* Global Toast Notifications */}
                  <Toaster 
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: '#1e293b',
                        color: '#f8fafc',
                        border: '1px solid #334155',
                      },
                      success: {
                        iconTheme: {
                          primary: '#10b981',
                          secondary: '#f8fafc',
                        },
                      },
                      error: {
                        iconTheme: {
                          primary: '#ef4444',
                          secondary: '#f8fafc',
                        },
                      },
                    }}
                  />
                </div>
              </Router>
            </FreeMapProvider>
          </TripProvider>
        </AuthProvider>
      </AirportsProvider>
    </ErrorBoundary>
  );
}

export default App; 