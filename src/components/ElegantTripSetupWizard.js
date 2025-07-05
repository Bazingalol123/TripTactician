import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  Users, 
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Plane,
  Camera,
  Coffee,
  Utensils,
  ShoppingBag,
  Mountain,
  Music,
  Palette,
  Clock,
  BookOpen,
  Gamepad2,
  Heart
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTrip } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';


const INTERESTS = [
  { id: 'museums', name: 'Museums', icon: BookOpen, color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { id: 'food', name: 'Food & Dining', icon: Utensils, color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { id: 'nightlife', name: 'Nightlife', icon: Music, color: 'bg-pink-50 text-pink-600 border-pink-200' },
  { id: 'outdoor', name: 'Outdoor Activities', icon: Mountain, color: 'bg-green-50 text-green-600 border-green-200' },
  { id: 'shopping', name: 'Shopping', icon: ShoppingBag, color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { id: 'culture', name: 'Culture', icon: Palette, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  { id: 'history', name: 'History', icon: Clock, color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { id: 'art', name: 'Art Galleries', icon: Palette, color: 'bg-rose-50 text-rose-600 border-rose-200' },
  { id: 'sports', name: 'Sports & Events', icon: Gamepad2, color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
  { id: 'wellness', name: 'Wellness & Spa', icon: Heart, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { id: 'photography', name: 'Photography', icon: Camera, color: 'bg-gray-50 text-gray-600 border-gray-200' },
  { id: 'coffee', name: 'Coffee Culture', icon: Coffee, color: 'bg-yellow-50 text-yellow-600 border-yellow-200' }
];

const ElegantTripSetupWizard = () => {
  const { setDraftTrip, userTrips, fetchTripById, updateTrip, createNewTrip } = useTrip();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editTripId = searchParams.get('edit');

  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    passengers: 1,
    interests: [],
    budget: '',
    tripType: 'leisure'
  });

  // Load trip for editing
  useEffect(() => {
    if (editTripId) {
      const loadTripForEdit = async () => {
        try {
          const trip = await fetchTripById(editTripId);
          if (trip) {
            setIsEditMode(true);
            setFormData({
              title: trip.title || '',
              destination: trip.destination || '',
              startDate: trip.startDate ? trip.startDate.split('T')[0] : '',
              endDate: trip.endDate ? trip.endDate.split('T')[0] : '',
              passengers: trip.passengers || 1,
              interests: trip.interests || [],
              budget: trip.estimatedCost || '',
              tripType: trip.tripType || 'leisure'
            });
          }
        } catch (error) {
          toast.error('Failed to load trip for editing');
          navigate('/dashboard');
        }
      };
      loadTripForEdit();
    }
  }, [editTripId]);

  const steps = [
    { id: 0, title: 'Destination', subtitle: 'Where would you like to go?', icon: MapPin },
    { id: 1, title: 'Dates', subtitle: 'When are you traveling?', icon: Calendar },
    { id: 2, title: 'Travelers', subtitle: 'Who\'s joining the adventure?', icon: Users },
    { id: 3, title: 'Interests', subtitle: 'What excites you most?', icon: Sparkles }
  ];

  const currentStepData = steps[step];

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return formData.destination.trim().length > 0;
      case 1:
        return formData.startDate && formData.endDate;
      case 2:
        return formData.passengers >= 1;
      case 3:
        return true; // Interests are optional
      default:
        return false;
    }
  };

  const toggleInterest = (interestId) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  const handleSubmit = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }

    // === ENHANCEMENT: Validate required fields ===
    const requiredFields = [
      { key: 'destination', label: 'Destination' },
      { key: 'startDate', label: 'Start Date' },
      { key: 'endDate', label: 'End Date' },
      { key: 'passengers', label: 'Number of Travelers' }
    ];
    for (const field of requiredFields) {
      if (!formData[field.key] || (typeof formData[field.key] === 'string' && !formData[field.key].trim())) {
        toast.error(`Please enter a valid ${field.label}.`);
        setIsGenerating(false);
        return;
      }
    }
    // === END ENHANCEMENT ===

    setIsGenerating(true);
    
    try {
      const tripData = {
        ...formData,
        duration: calculateDays(),
        userId: user?.id
      };

      await setDraftTrip(tripData);
      toast.success('Trip preferences saved! 🎉');
      
      // Provide user with options for trip planning approach
      const userChoice = await new Promise((resolve) => {
        // Show modal with updated options
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
        modal.innerHTML = `
          <div class="bg-white rounded-lg max-w-lg w-full p-6">
            <h3 class="text-xl font-semibold mb-4">Choose Your Trip Planning Method</h3>
            <div class="space-y-4">
              <button id="unified-btn" class="w-full p-4 border-2 border-emerald-500 rounded-lg hover:bg-emerald-50 text-left bg-emerald-50">
                <div class="font-semibold text-emerald-700">🚀 Smart AI Trip (Recommended)</div>
                <div class="text-sm text-gray-600 mt-1">Complete itinerary using real places from Google + AI optimization</div>
                <div class="text-xs text-emerald-600 mt-2">✨ NEW: Real data + AI structuring + Editable with recommendations</div>
              </button>
              <button id="smart-btn" class="w-full p-4 border border-blue-500 rounded-lg hover:bg-blue-50 text-left">
                <div class="font-semibold text-blue-600">🧠 Smart Recommendations Only</div>
                <div class="text-sm text-gray-600 mt-1">Browse real places by category without structured itinerary</div>
              </button>
              <button id="ai-btn" class="w-full p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left opacity-75">
                <div class="font-semibold text-gray-500">🤖 Classic AI Trip (Legacy)</div>
                <div class="text-sm text-gray-500 mt-1">Traditional AI-generated fictional places</div>
              </button>
            </div>
            <div class="mt-4 text-xs text-gray-500 text-center">
              💡 Smart AI Trip combines the best of both worlds: real data + intelligent planning
            </div>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('#unified-btn').onclick = () => {
          document.body.removeChild(modal);
          resolve('unified');
        };
        
        modal.querySelector('#smart-btn').onclick = () => {
          document.body.removeChild(modal);
          resolve('smart');
        };
        
        modal.querySelector('#ai-btn').onclick = () => {
          document.body.removeChild(modal);
          resolve('classic');
        };
      });

      if (userChoice === 'unified') {
        // Navigate to TripGenerationScreen for unified generation
        navigate('/trip-generation?mode=unified');
        
      } else if (userChoice === 'smart') {
        navigate(`/recommendations?destination=${encodeURIComponent(formData.destination)}&duration=${calculateDays()}&interests=${formData.interests.join(',')}&budget=${formData.budget || 'moderate'}`);
      } else if (userChoice === 'classic') {
        navigate('/trip-generation?mode=classic');
      }
      
    } catch (error) {
      console.error('Error in trip generation:', error);
      toast.error('Failed to generate trip. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
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
                  {isEditMode ? 'Edit Trip' : 'Plan New Trip'}
                </h1>
                <p className="text-gray-600">
                  {isEditMode ? 'Update your travel details' : 'Let\'s create your perfect adventure'}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {steps.map((stepItem, index) => (
              <div key={stepItem.id} className="flex items-center">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    index < step 
                      ? 'bg-green-500 text-white' 
                      : index === step 
                        ? 'bg-sky-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index < step ? <Check size={16} /> : index + 1}
                  </div>
                  <div className="ml-2 hidden sm:block">
                    <div className={`text-sm font-medium ${
                      index <= step ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {stepItem.title}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block w-12 h-0.5 mx-4 ${
                    index < step ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            {/* Step Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <currentStepData.icon size={32} className="text-sky-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {currentStepData.title}
              </h2>
              <p className="text-gray-600 text-lg">
                {currentStepData.subtitle}
              </p>
            </div>

            {/* Step Content */}
            <div className="max-w-2xl mx-auto">
              {step === 0 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trip Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors"
                      placeholder="My Amazing Adventure"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Destination *
                    </label>
                    <div className="relative">
                      <MapPin size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={formData.destination}
                        onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors"
                        placeholder="e.g. Tokyo, Japan"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trip Type
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { value: 'leisure', label: 'Leisure & Vacation' },
                        { value: 'business', label: 'Business Travel' },
                        { value: 'adventure', label: 'Adventure & Sports' },
                        { value: 'cultural', label: 'Cultural Experience' }
                      ].map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, tripType: type.value })}
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            formData.tripType === type.value
                              ? 'border-sky-500 bg-sky-50 text-sky-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors"
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  {formData.startDate && formData.endDate && (
                    <div className="bg-sky-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-sky-700">
                        {calculateDays()} Days
                      </div>
                      <div className="text-sky-600">
                        Total trip duration
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Budget (Optional)
                    </label>
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-colors"
                      placeholder="e.g. 2000"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      This helps us suggest activities within your budget
                    </p>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center space-x-4 bg-gray-50 rounded-lg p-4">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, passengers: Math.max(1, formData.passengers - 1) })}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
                      >
                        -
                      </button>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                          {formData.passengers}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formData.passengers === 1 ? 'Traveler' : 'Travelers'}
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, passengers: Math.min(20, formData.passengers + 1) })}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Travel Tips</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Solo travel: More flexibility, easier bookings</li>
                      <li>• Groups of 2-4: Perfect for shared experiences</li>
                      <li>• Large groups (5+): Consider group discounts</li>
                    </ul>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <p className="text-gray-600">
                      Select what interests you most. This helps us personalize your itinerary.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {INTERESTS.map((interest) => {
                      const Icon = interest.icon;
                      const isSelected = formData.interests.includes(interest.id);
                      
                      return (
                        <button
                          key={interest.id}
                          type="button"
                          onClick={() => toggleInterest(interest.id)}
                          className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                            isSelected
                              ? 'border-sky-500 bg-sky-50 text-sky-700'
                              : `border-gray-200 hover:border-gray-300 ${interest.color}`
                          }`}
                        >
                          <Icon size={24} className="mx-auto mb-2" />
                          <div className="text-sm font-medium">
                            {interest.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {formData.interests.length > 0 && (
                    <div className="bg-sky-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-sky-900 mb-2">
                        Selected Interests ({formData.interests.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.interests.map((interestId) => {
                          const interest = INTERESTS.find(i => i.id === interestId);
                          return (
                            <span
                              key={interestId}
                              className="px-3 py-1 bg-sky-200 text-sky-800 rounded-full text-sm"
                            >
                              {interest?.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 0}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  step === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <div className="text-sm text-gray-500">
                Step {step + 1} of {steps.length}
              </div>

              {step === steps.length - 1 ? (
                <motion.button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canProceed() || isGenerating}
                  className="flex items-center space-x-2 px-8 py-3 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white rounded-lg font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isEditMode ? 'Update Trip' : 'Create Trip'}</span>
                      <Sparkles size={16} />
                    </>
                  )}
                </motion.button>
              ) : (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="flex items-center space-x-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white rounded-lg font-medium transition-colors"
                >
                  <span>Next</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ElegantTripSetupWizard; 