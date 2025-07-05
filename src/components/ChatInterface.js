import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Bot, User, Sparkles, MapPin, Calendar, Clock, Navigation, FileText, Download, Share2, Star, Plane, Globe, Camera, Heart, Coffee, Mountain, ShoppingBag, Utensils, Building, Compass, Map as MapIcon, Route, ChevronDown, DollarSign, Lightbulb } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import ProductionMapView from './ProductionMapView';
import TripItineraryView from './TripItineraryView';
import './ChatInterface.css';

const ChatInterface = () => {
  const { user } = useAuth();
  const { createNewTrip } = useTrip();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [showFullItinerary, setShowFullItinerary] = useState(false);
  const [suggestions] = useState([
    "Plan a 7-day romantic trip to Paris for 2 people",
    "I want a budget backpacking adventure through Southeast Asia",
    "Create a family-friendly itinerary for Tokyo with kids",
    "Find hidden gems in Morocco for culture lovers",
    "Plan a foodie tour through Italy's best regions",
    "Design a luxury spa retreat in Bali"
  ]);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 1,
        type: 'ai',
        content: `Hello ${user?.firstName || 'there'}! ✈️ I'm your AI travel companion. Just tell me where you want to go and I'll create the perfect trip for you!`,
        timestamp: new Date(),
        avatar: <Bot className="h-6 w-6" />,
        actions: []
      }]);
    }
  }, [user, messages.length]);

  // Voice recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast.error('Voice recognition failed. Please try again.');
      };
    }
  }, []);

  const handleVoiceInput = () => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        recognitionRef.current.start();
        setIsListening(true);
      }
    } else {
      toast.error('Voice recognition not supported in this browser.');
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      avatar: <User className="h-6 w-6" />
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Send to AI endpoint
      const response = await fetch('/api/chat-travel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: inputMessage,
          conversationHistory: messages.slice(-10), // Last 10 messages for context
          userPreferences: user?.travelPreferences || {}
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to get AI response');

      // Create AI response message
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        avatar: <Bot className="h-6 w-6" />,
        trip: data.trip || null,
        actions: data.actions || []
      };

      setMessages(prev => [...prev, aiMessage]);

      // If AI generated a trip, save it
      if (data.trip) {
        setCurrentTrip(data.trip);
        setShowMap(true);
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: `I'm sorry, I encountered an error. Please try again! 😅`,
        timestamp: new Date(),
        avatar: <Bot className="h-6 w-6" />,
        actions: []
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const saveTrip = async (trip) => {
    try {
      const response = await createNewTrip(trip);
      if (response.success) {
        toast.success('Trip saved successfully! 🎉');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      toast.error('Failed to save trip');
    }
  };

  const exportTrip = (trip) => {
    const tripData = JSON.stringify(trip, null, 2);
    const blob = new Blob([tripData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trip.destination || 'trip'}-itinerary.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Trip exported successfully! 📄');
  };

  const openInOpenStreetMap = (destination) => {
    const encodedDestination = encodeURIComponent(destination);
    window.open(`https://www.openstreetmap.org/search?query=${encodedDestination}`, '_blank');
  };

  return (
    <div className="chat-interface">
      <div className="chat-layout">
        {/* Chat Panel */}
        <div className={cn("chat-panel", showMap && "with-map")}>
          <div className="chat-header">
            <div className="chat-title">
              <div className="title-icon">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="h-6 w-6 text-primary" />
                </motion.div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">AI Travel Companion</h1>
                <p className="text-sm text-muted-foreground">Your personal trip planner</p>
              </div>
            </div>
            {currentTrip && (
              <div className="chat-actions">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMap(!showMap)}
                  className="btn-icon"
                >
                  <MapIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="messages-container">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={cn(
                    "message",
                    message.type === 'user' ? "message-user" : "message-ai"
                  )}
                >
                  <div className="message-avatar">
                    {message.avatar}
                  </div>
                  <div className="message-content">
                    <div className="message-bubble">
                      <p className="message-text">{message.content}</p>
                      {message.trip && (
                        <TripCard 
                          trip={message.trip} 
                          onSave={() => saveTrip(message.trip)}
                          onExport={() => exportTrip(message.trip)}
                          onViewMap={() => {
                            setCurrentTrip(message.trip);
                            setShowFullItinerary(true);
                          }}
                        />
                      )}
                    </div>
                    <div className="message-actions">
                      {message.actions?.map((action, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={action.onClick}
                          className="text-xs"
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                    <span className="message-time">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="message message-ai"
              >
                <div className="message-avatar">
                  <Bot className="h-6 w-6" />
                </div>
                <div className="message-content">
                  <div className="message-bubble">
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="suggestions-container">
              <p className="suggestions-title">Try asking:</p>
              <div className="suggestions-grid">
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="suggestion-card"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="input-container">
            <div className="input-wrapper">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Where would you like to go? Describe your dream trip..."
                className="chat-input"
                rows={1}
                style={{ 
                  height: 'auto',
                  minHeight: '48px',
                  maxHeight: '120px',
                  resize: 'none'
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
              />
              <div className="input-actions">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleVoiceInput}
                  className={cn("btn-icon", isListening && "text-primary")}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="send-btn"
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Map Panel */}
        <AnimatePresence>
          {showMap && currentTrip && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="map-panel"
            >
              <div className="map-header">
                <h3 className="font-semibold text-foreground">Trip Route</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMap(false)}
                  className="btn-icon"
                >
                  ×
                </Button>
              </div>
              <div className="map-container">
                <ProductionMapView
                  activities={currentTrip.dailyItineraries?.flatMap((day, dayIndex) => 
                    day.activities?.map(activity => ({ ...activity, dayIndex })) || []
                  ) || []}
                  height="100%"
                  className="h-full"
                  showControls={true}
                  enableRouting={true}
                  enableGeolocation={true}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full Itinerary View */}
        <TripItineraryView
          trip={currentTrip}
          isVisible={showFullItinerary}
          onClose={() => setShowFullItinerary(false)}
        />
      </div>
    </div>
  );
};

// Enhanced Trip Card Component
const TripCard = ({ trip, onSave, onExport, onViewMap }) => {
  const [expandedDay, setExpandedDay] = useState(null);
  const [showFullItinerary, setShowFullItinerary] = useState(false);

  const toggleDay = (dayIndex) => {
    setExpandedDay(expandedDay === dayIndex ? null : dayIndex);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      sightseeing: '🏛️',
      dining: '🍽️',
      culture: '🎨',
      entertainment: '🎭',
      shopping: '🛍️',
      nature: '🌿',
      transport: '🚗',
      accommodation: '🏨'
    };
    return icons[category] || '📍';
  };

  return (
    <div className="trip-card">
      {/* Trip Header */}
      <div className="trip-header">
        <div className="trip-main-info">
          <div className="trip-destination">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-bold text-lg text-foreground">{trip.title || trip.destination}</h3>
              <p className="text-sm text-muted-foreground">{trip.destination}</p>
            </div>
          </div>
          <div className="trip-metadata">
            <div className="trip-stat">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="trip-stat">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{trip.duration} days</span>
            </div>
            {trip.estimatedCost && (
              <div className="trip-stat">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(trip.estimatedCost)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trip Summary */}
      {trip.dailyItineraries && (
        <div className="trip-summary">
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-value">{trip.dailyItineraries.length}</span>
              <span className="stat-label">Days</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {trip.dailyItineraries.reduce((total, day) => total + (day.activities?.length || 0), 0)}
              </span>
              <span className="stat-label">Activities</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{trip.budget || 'Moderate'}</span>
              <span className="stat-label">Budget</span>
            </div>
          </div>
        </div>
      )}

      {/* Daily Itineraries */}
      {trip.dailyItineraries && (
        <div className="daily-itineraries">
          <div className="itinerary-header">
            <h4 className="font-semibold text-foreground">Daily Itinerary</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullItinerary(!showFullItinerary)}
              className="text-xs"
            >
              {showFullItinerary ? 'Show Less' : 'Show All'}
            </Button>
          </div>

          <div className="days-container">
            {(showFullItinerary ? trip.dailyItineraries : trip.dailyItineraries.slice(0, 3)).map((day, dayIndex) => (
              <div key={dayIndex} className="day-card">
                <div 
                  className="day-header"
                  onClick={() => toggleDay(dayIndex)}
                >
                  <div className="day-info">
                    <div className="day-number">Day {day.day}</div>
                    <div className="day-details">
                      <div className="day-theme">{day.theme}</div>
                      <div className="day-date">{new Date(day.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="day-meta">
                    <span className="activities-count">
                      {day.activities?.length || 0} activities
                    </span>
                    {day.totalBudget && (
                      <span className="day-budget">
                        {formatCurrency(day.totalBudget)}
                      </span>
                    )}
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      expandedDay === dayIndex && "rotate-180"
                    )} />
                  </div>
                </div>

                <AnimatePresence>
                  {expandedDay === dayIndex && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="day-activities"
                    >
                      {day.activities?.map((activity, actIndex) => (
                        <div key={actIndex} className="activity-item">
                          <div className="activity-time">
                            {formatTime(activity.time)}
                          </div>
                          <div className="activity-content">
                            <div className="activity-header">
                              <span className="activity-icon">
                                {getCategoryIcon(activity.category)}
                              </span>
                              <div className="activity-info">
                                <h5 className="activity-name">{activity.name}</h5>
                                <p className="activity-location">{activity.location}</p>
                              </div>
                              {activity.cost > 0 && (
                                <span className="activity-cost">
                                  {formatCurrency(activity.cost)}
                                </span>
                              )}
                            </div>
                            <p className="activity-description">{activity.description}</p>
                            {activity.tips && (
                              <div className="activity-tips">
                                <Lightbulb className="h-3 w-3" />
                                <span>{activity.tips}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {!showFullItinerary && trip.dailyItineraries.length > 3 && (
            <div className="show-more-hint">
              <span className="text-sm text-muted-foreground">
                +{trip.dailyItineraries.length - 3} more days
              </span>
            </div>
          )}
        </div>
      )}

      {/* Trip Actions */}
      <div className="trip-actions">
        <Button variant="outline" size="sm" onClick={onSave} className="action-btn">
          <Heart className="h-4 w-4" />
          Save Trip
        </Button>
        <Button variant="outline" size="sm" onClick={onExport} className="action-btn">
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button variant="outline" size="sm" onClick={onViewMap} className="action-btn">
          <Navigation className="h-4 w-4" />
          View Map
        </Button>
      </div>
    </div>
  );
};

export default ChatInterface; 