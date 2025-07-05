import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  MapPin, 
  Calendar, 
  Users, 
  Search,
  Route,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Plane,
  RefreshCw
} from 'lucide-react';
import { useTrip } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { generateUnifiedTrip } from '../services/api';
import { useCallback } from 'react';

const TripGenerationScreen = () => {
  const { draftTrip, createNewTrip } = useTrip();
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedTrip, setGeneratedTrip] = useState(null);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMode, setGenerationMode] = useState('unified'); // 'unified', 'classic', 'smart'

  const getStepsForMode = (mode) => {
    const commonSteps = [
      { 
        id: 0, 
        label: 'Analyzing Your Preferences', 
        description: 'Understanding your travel style and interests',
        icon: Sparkles, 
        duration: 2000,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      }
    ];

    if (mode === 'unified') {
      return [
        ...commonSteps,
        { 
          id: 1, 
          label: 'Fetching Real Places', 
          description: 'Searching Google Places API for authentic destinations',
          icon: Search, 
          duration: 3000,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        },
        { 
          id: 2, 
          label: 'AI Scoring & Ranking', 
          description: 'Intelligent analysis of 180+ real places',
          icon: MapPin, 
          duration: 2500,
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        },
        { 
          id: 3, 
          label: 'Smart Itinerary Creation', 
          description: 'AI structuring real data into perfect daily schedules',
          icon: Calendar, 
          duration: 2000,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50'
        },
        { 
          id: 4, 
          label: 'Finalizing Your Journey', 
          description: 'Optimizing routes and adding local insights',
          icon: Route, 
          duration: 0, // This step will be controlled by actual LLM response
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50'
        }
      ];
    } else {
      return [
        ...commonSteps,
        { 
          id: 1, 
          label: 'Searching Destinations', 
          description: 'Finding the best spots in your destination',
          icon: Search, 
          duration: 3000,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        },
        { 
          id: 2, 
          label: 'Mapping Attractions', 
          description: 'Locating must-see places and hidden gems',
          icon: MapPin, 
          duration: 2500,
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        },
        { 
          id: 3, 
          label: 'Creating Your Schedule', 
          description: 'Optimizing timing and logistics',
          icon: Calendar, 
          duration: 2000,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50'
        },
        { 
          id: 4, 
          label: 'AI Generating Your Comprehensive Itinerary', 
          description: 'Creating complete daily schedules with 8-12 activities including meals, coffee spots, and local experiences',
          icon: Sparkles, 
          duration: 0,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50'
        }
      ];
    }
  };

  const steps = getStepsForMode(generationMode);

  const generateTrip = useCallback(async () => {
    console.log('🚀 TRIP GENERATION STARTED');
    console.log('📋 Draft Trip Data:', draftTrip);
    console.log('🔧 Generation Mode:', generationMode);
    
    setIsGenerating(true);
    setError(null);

    try {
      console.log('⏳ Starting generation process...');
      
      // Step through the generation process with realistic timing (but don't complete final step yet)
      for (let i = 0; i < steps.length - 1; i++) {
        console.log(`📍 Step ${i + 1}/${steps.length - 1}: ${steps[i].label}`);
        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, steps[i].duration));
      }

      // Start the actual generation (final step)
      console.log('🎯 Starting actual trip generation...');
      setCurrentStep(steps.length - 1);
      
      const { destination, startDate, endDate, passengers, interests, budget } = draftTrip;
      
      console.log('📊 Trip Parameters:', {
        destination,
        startDate,
        endDate,
        passengers,
        interests,
        budget,
        generationMode
      });
      
      if (generationMode === 'unified') {
        console.log('🌟 Using UNIFIED generation mode');
        
        // Generate unified trip (real data + AI structuring)
        const unifiedTripData = {
          destination,
          duration: calculateDays(),
          interests: interests || [],
          budget: budget || 'moderate',
          groupSize: passengers || 2,
          startDate
        };
        
        console.log('📤 Calling generateUnifiedTrip with:', unifiedTripData);
        const startTime = Date.now();
        
        const result = await generateUnifiedTrip(unifiedTripData);
        
        const endTime = Date.now();
        console.log(`⏱️ generateUnifiedTrip took ${endTime - startTime}ms`);
        console.log('📥 generateUnifiedTrip result:', result);

        if (result.success) {
          console.log('✅ Unified trip generation successful');
          
          // Now mark the final step as complete
          setCurrentStep(steps.length);
          
          // Add a 2-second delay to show completion
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          setGeneratedTrip(result.trip);
          
          console.log('💾 Saving trip to database...');
          const tripToSave = {
            ...result.trip,
            userId: draftTrip.userId,
            generatedAt: new Date().toISOString()
          };
          
          console.log('📋 Trip data to save:', tripToSave);
          
          // Save trip to database
          const saveStartTime = Date.now();
          const saveResult = await createNewTrip(tripToSave);
          const saveEndTime = Date.now();
          
          console.log(`⏱️ Trip save took ${saveEndTime - saveStartTime}ms`);
          console.log('💾 Save result:', saveResult);
          
          if (saveResult.success) {
            console.log('✅ Trip saved successfully, navigating...');
            toast.success(`🎉 Comprehensive Trip Created! ${result.stats?.totalActivities || 'Many'} activities including full meal planning & local experiences!`);
            setTimeout(() => {
              navigate(`/trip/${String(saveResult.trip._id)}`);
            }, 2000);
          } else {
            console.error('❌ Failed to save trip to database:', saveResult.error);
            throw new Error('Failed to save trip to database');
          }
        } else {
          console.error('❌ Unified trip generation failed:', result.error);
          throw new Error(result.error || 'Failed to generate unified trip');
        }
      } else {
        console.log('🤖 Using CLASSIC AI generation mode');
        
        // Classic AI generation (original functionality)
        const prompt = `Generate a complete trip itinerary for ${passengers} people to ${destination} from ${startDate} to ${endDate}. Interests: ${interests.join(', ')}.`;
        
        console.log('📝 AI Prompt:', prompt);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('⏰ AI Request timeout triggered (5 minutes)');
          controller.abort();
        }, 300000); // 5 minutes

        console.log('📤 Sending request to /api/chat-travel...');
        const aiStartTime = Date.now();
        
        const response = await fetch('/api/chat-travel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            message: prompt,
            conversationHistory: [],
            userPreferences: { interests }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const aiEndTime = Date.now();
        console.log(`⏱️ AI request took ${aiEndTime - aiStartTime}ms`);
        
        const data = await response.json();
        console.log('📥 AI Response:', data);

        if (!response.ok) {
          console.error('❌ AI API error:', data.error);
          throw new Error(data.error);
        }

        if (data.trip) {
          console.log('✅ AI trip generation successful');
          
          // Now mark the final step as complete
          setCurrentStep(steps.length);
          
          // Add a 2-second delay to show completion
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          setGeneratedTrip(data.trip);
          
          console.log('💾 Saving AI-generated trip to database...');
          
          // Save trip to database
          const saveStartTime = Date.now();
          const saveResult = await createNewTrip(data.trip);
          const saveEndTime = Date.now();
          
          console.log(`⏱️ AI Trip save took ${saveEndTime - saveStartTime}ms`);
          console.log('💾 AI Save result:', saveResult);
          
          if (saveResult.success) {
            console.log('✅ AI Trip saved successfully, navigating...');
            toast.success('🎯 Comprehensive Journey Created! Complete daily schedules with meals, activities & local experiences!');
            setTimeout(() => {
              navigate(`/trip-view/${String(saveResult.trip._id)}`);
            }, 2000);
          } else {
            console.error('❌ Failed to save AI trip:', saveResult.error);
            throw new Error('Failed to save trip to database');
          }
        } else {
          console.error('❌ No trip data in AI response');
          throw new Error('No trip data generated');
        }
      }

    } catch (err) {
      console.error('❌ TRIP GENERATION FAILED:', err);
      console.error('❌ Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      
      if (err.name === 'AbortError') {
        console.log('⏰ Request was aborted due to timeout');
        setError('Request timed out. The AI is taking longer than expected to generate your trip. Please try again.');
      } else {
        setError(err.message);
      }
      setIsGenerating(false);
    }
  }, [draftTrip, generationMode, steps, navigate, token, createNewTrip]);

  useEffect(() => {
    if (!draftTrip) {
      navigate('/setup');
      return;
    }

    // Check URL parameters for generation mode
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') || 'unified';
    setGenerationMode(mode);
  }, [draftTrip, navigate]);

  useEffect(() => {
    if (draftTrip && generationMode) {
      generateTrip();
    }
  }, [draftTrip, generationMode]); // generateTrip is stable due to useCallback

  const retryGeneration = () => {
    setError(null);
    setCurrentStep(0);
    generateTrip();
  };

  const goBackToSetup = () => {
    navigate('/setup');
  };

  if (!draftTrip) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateDays = () => {
    if (draftTrip.startDate && draftTrip.endDate) {
      const start = new Date(draftTrip.startDate);
      const end = new Date(draftTrip.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays + 1;
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center">
                <Plane size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Creating Your Perfect Trip
                </h1>
                <p className="text-gray-600">
                  Sit back and enjoy while we generate an amazing trip for you ✨
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Trip Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {draftTrip.title || `${draftTrip.destination} Adventure`}
            </h2>
            
            <div className="flex flex-wrap justify-center items-center gap-6 text-gray-600">
              <div className="flex items-center space-x-2">
                <MapPin size={16} className="text-sky-500" />
                <span>{draftTrip.destination}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-green-500" />
                <span>{formatDate(draftTrip.startDate)} - {formatDate(draftTrip.endDate)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users size={16} className="text-purple-500" />
                <span>{draftTrip.passengers} {draftTrip.passengers === 1 ? 'traveler' : 'travelers'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock size={16} className="text-orange-500" />
                <span>{calculateDays()} days</span>
              </div>
            </div>

            {draftTrip.interests && draftTrip.interests.length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-gray-500 mb-2">Your Interests</div>
                <div className="flex flex-wrap justify-center gap-2">
                  {draftTrip.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Generation Progress */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Generation Failed
              </h3>
              <p className="text-gray-600 mb-6">
                {error}
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={retryGeneration}
                  className="flex items-center space-x-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors"
                >
                  <RefreshCw size={16} />
                  <span>Try Again</span>
                </button>
                <button
                  onClick={goBackToSetup}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  <span>Back to Setup</span>
                </button>
              </div>
            </motion.div>
          ) : generatedTrip ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Trip Generated Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                Your personalized itinerary is ready. Redirecting you to view your trip...
              </p>
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent mx-auto"></div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Creating Your Itinerary
                </h3>
                <p className="text-gray-600">
                  Sit back and relax while our AI crafts the perfect adventure for you 🌟
                </p>
              </div>

              {/* Progress Steps */}
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep || (index < steps.length && currentStep >= steps.length);

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-500 ${
                        isActive 
                          ? `${step.bgColor} border-2 border-current ${step.color}` 
                          : isCompleted 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                        isActive 
                          ? `bg-white ${step.color}` 
                          : isCompleted 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 text-gray-500'
                      }`}>
                        {isActive ? (
                          <Icon size={20} className="animate-pulse" />
                        ) : isCompleted ? (
                          <CheckCircle size={20} />
                        ) : (
                          <Icon size={20} />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className={`font-semibold transition-colors duration-500 ${
                          isActive 
                            ? step.color 
                            : isCompleted 
                              ? 'text-green-700' 
                              : 'text-gray-500'
                        }`}>
                          {step.label}
                        </h4>
                        <p className={`text-sm ${
                          isActive 
                            ? 'text-gray-700' 
                            : isCompleted 
                              ? 'text-green-600' 
                              : 'text-gray-400'
                        }`}>
                          {step.description}
                        </p>

                        {/* Progress Bar for Active Step */}
                        {isActive && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: step.duration / 1000, ease: 'linear' }}
                            className="mt-2 h-1 bg-white rounded-full overflow-hidden"
                          >
                            <div className={`h-full ${step.color.replace('text-', 'bg-')} rounded-full`} />
                          </motion.div>
                        )}
                      </div>

                      {/* Status Indicator */}
                      <div className="flex-shrink-0">
                        {isCompleted && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                          >
                            <CheckCircle size={16} className="text-white" />
                          </motion.div>
                        )}
                        {isActive && (
                          <div className="w-6 h-6">
                            <div className={`w-full h-full rounded-full animate-ping ${step.color.replace('text-', 'bg-')} opacity-75`} />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Overall Progress */}
              <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-sky-500 to-purple-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>

              <div className="text-center text-sm text-gray-500">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>
          )}
        </div>

        {/* Tips Section */}
        {isGenerating && !error && !generatedTrip && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
            className="mt-8 bg-blue-50 rounded-2xl p-6"
          >
            <h4 className="font-semibold text-blue-900 mb-3">
              Sit back and enjoy - here's what's happening behind the scenes...
            </h4>
            <div className="text-sm text-blue-700 space-y-2">
              <p>✨ Analyzing thousands of travel recommendations just for you</p>
              <p>🗺️ Finding the best attractions, restaurants, and hidden gems</p>
              <p>⏰ Optimizing your schedule for maximum enjoyment</p>
              <p>🎯 Personalizing every detail based on your interests</p>
              <p>🤖 Our AI is working hard to create something amazing!</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TripGenerationScreen; 