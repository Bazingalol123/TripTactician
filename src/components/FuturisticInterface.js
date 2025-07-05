import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  Map, 
  Calendar, 
  Compass, 
  Rocket,
  Star,
  Zap,
  Brain,
  Settings,
  User,
  Camera,
  Share,
  Download,
  Play,
  Pause,
  RotateCcw,
  Navigation,
  MapPin,
  Clock,
  Heart,
  Eye,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import ParticleField from './ui/ParticleField';
import HolographicCard from './ui/HolographicCard';
import VoiceWaveform from './ui/VoiceWaveform';
import ProductionMapView from './ProductionMapView';
import './FuturisticInterface.css';

const FuturisticInterface = () => {
  const { user } = useAuth();
  const { createNewTrip, draftTrip, setDraftTrip } = useTrip();
  
  // Core state
  const [activeMode, setActiveMode] = useState('command'); // command, explore, create, analyze
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [inputText, setInputText] = useState('');
  const [currentTrip, setCurrentTrip] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [showMap, setShowMap] = useState(false);
  
  // UI state
  const [hoveredPanel, setHoveredPanel] = useState(null);
  const [panelPositions, setPanelPositions] = useState({});
  const [isCommandCenterMode, setIsCommandCenterMode] = useState(true);
  
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage = {
      id: Date.now(),
      type: 'system',
      content: `🚀 Welcome to the Travel Command Center, ${user?.firstName || 'Commander'}! \n\nYour AI-powered mission control is online. Just speak or type where you want to explore, and I'll generate your complete mission briefing.`,
      timestamp: new Date(),
      priority: 'high'
    };
    setMessages([welcomeMessage]);
  }, [user]);

  // Voice recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsVoiceActive(false);
        processCommand(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsVoiceActive(false);
      };

      recognitionRef.current.onerror = () => {
        setIsVoiceActive(false);
        toast.error('Voice recognition failed. Please try again.');
      };
    }
  }, []);

  const toggleVoiceInput = () => {
    if (recognitionRef.current) {
      if (isVoiceActive) {
        recognitionRef.current.stop();
        setIsVoiceActive(false);
      } else {
        recognitionRef.current.start();
        setIsVoiceActive(true);
      }
    } else {
      toast.error('Voice recognition not supported in this browser.');
    }
  };

  const processCommand = async (command = inputText) => {
    if (!command.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: command,
      timestamp: new Date(),
      mode: activeMode
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      // Send to AI endpoint
      const response = await fetch('/api/chat-travel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: command,
          conversationHistory: messages.slice(-10),
          userPreferences: user?.travelPreferences || {},
          mode: activeMode
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
        trip: data.trip || null,
        actions: data.actions || [],
        priority: data.trip ? 'high' : 'normal'
      };

      setMessages(prev => [...prev, aiMessage]);

      // If AI generated a trip, save it and show it
      if (data.trip) {
        setCurrentTrip(data.trip);
        setShowMap(true);
        setActiveMode('explore');
        
        // Auto-save the trip
        setTimeout(async () => {
          try {
            const response = await createNewTrip(data.trip);
            if (response.success) {
              toast.success('🎯 Mission saved to command center!', {
                style: { background: '#0f172a', color: '#06b6d4' }
              });
            }
          } catch (error) {
            console.error('Auto-save failed:', error);
          }
        }, 1000);
      }

    } catch (error) {
      console.error('Command processing error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'system',
        content: `⚠️ Command processing failed. Please retry your mission request.`,
        timestamp: new Date(),
        priority: 'warning'
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Command failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    // Auto-generate trip from draftTrip when component mounts
    if (draftTrip && messages.length === 1 && !currentTrip) {
      console.log('🚀 Auto-generating trip from wizard data:', draftTrip);
      
      const { destination, startDate, endDate, passengers, interests } = draftTrip;
      const autoPrompt = `Generate a complete trip itinerary for ${passengers} people to ${destination} from ${startDate} to ${endDate}. ` +
        (interests.length ? `Interests: ${interests.join(', ')}.` : '') +
        ' Create a detailed day-by-day schedule with specific activities, restaurants, and attractions.';
      
      // Auto-process this prompt to generate the initial trip
      processCommand(autoPrompt);
      
      // Clear the draftTrip since we're generating the actual trip
      setDraftTrip(null);
    }
  }, [draftTrip, messages.length, currentTrip]);

  const modes = [
    { 
      id: 'command', 
      label: 'Command', 
      icon: Sparkles, 
      color: '#06b6d4',
      description: 'AI Command Center'
    },
    { 
      id: 'explore', 
      label: 'Explore', 
      icon: Globe, 
      color: '#8b5cf6',
      description: 'Interactive Maps' 
    },
    { 
      id: 'create', 
      label: 'Create', 
      icon: Rocket, 
      color: '#f59e0b',
      description: 'Trip Designer' 
    },
    { 
      id: 'analyze', 
      label: 'Analyze', 
      icon: Brain, 
      color: '#10b981',
      description: 'Data Insights' 
    }
  ];

  const quickCommands = [
    "Plan a luxury safari in Kenya for 10 days",
    "Create a romantic getaway to Santorini",
    "Design a foodie tour through Japan",
    "Build a backpacking adventure in Southeast Asia",
    "Organize a family trip to Disney World",
    "Plan a business trip to London with free time"
  ];

  return (
    <div className="futuristic-interface">
      {/* Particle Background */}
      <ParticleField />
      
      {/* Neural Network Background */}
      <div className="neural-background" />
      
      {/* Main Interface */}
      <div className="interface-container">
        
        {/* Header - Command Center Style */}
        <motion.header 
          className="command-header"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <div className="header-left">
            <div className="logo-section">
              <motion.div 
                className="logo-orb"
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                <Sparkles className="h-8 w-8" />
              </motion.div>
              <div className="logo-text">
                <h1>TRAVEL COMMAND</h1>
                <span>Mission Control Center</span>
              </div>
            </div>
          </div>
          
          <div className="header-center">
            <div className="mode-selector">
              {modes.map((mode) => (
                <motion.button
                  key={mode.id}
                  className={cn(
                    "mode-button",
                    activeMode === mode.id && "active"
                  )}
                  onClick={() => setActiveMode(mode.id)}
                  style={{ '--mode-color': mode.color }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <mode.icon className="h-5 w-5" />
                  <span>{mode.label}</span>
                  <div className="mode-glow" />
                </motion.button>
              ))}
            </div>
          </div>
          
          <div className="header-right">
            <div className="status-indicators">
              <div className="status-item">
                <div className="status-dot online" />
                <span>AI ONLINE</span>
              </div>
              <div className="status-item">
                <div className="status-dot" />
                <span>SECURE</span>
              </div>
            </div>
            
            <div className="user-profile">
              <div className="avatar">
                <User className="h-5 w-5" />
              </div>
              <span>{user?.firstName || 'Commander'}</span>
            </div>
          </div>
        </motion.header>

        {/* Main Content Area */}
        <div className="main-content">
          
          {/* Command Mode */}
          {activeMode === 'command' && (
            <motion.div 
              className="command-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              {/* Messages Display */}
              <HolographicCard className="messages-panel">
                <div className="panel-header">
                  <h3>Mission Communications</h3>
                  <div className="live-indicator">
                    <div className="pulse-dot" />
                    LIVE
                  </div>
                </div>
                
                <div className="messages-container">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className={cn(
                          "message",
                          `message-${message.type}`,
                          message.priority && `priority-${message.priority}`
                        )}
                      >
                        <div className="message-header">
                          <div className="message-sender">
                            {message.type === 'user' ? '👤 COMMANDER' : 
                             message.type === 'ai' ? '🤖 TRAVEL AI' : '⚡ SYSTEM'}
                          </div>
                          <div className="message-time">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                        
                        <div className="message-content">
                          {message.content}
                        </div>

                        {/* Trip Preview */}
                        {message.trip && (
                          <TripPreviewCard trip={message.trip} />
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="message message-ai processing"
                    >
                      <div className="processing-indicator">
                        <div className="processing-dots">
                          <div className="dot" />
                          <div className="dot" />
                          <div className="dot" />
                        </div>
                        <span>AI analyzing your mission request...</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </HolographicCard>

              {/* Command Input */}
              <HolographicCard className="command-input-panel">
                <div className="input-header">
                  <h4>Mission Command Interface</h4>
                  <VoiceWaveform isActive={isVoiceActive} />
                </div>
                
                <div className="command-input-container">
                  <div className="input-wrapper">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && processCommand()}
                      placeholder="Describe your mission... (e.g., 'Plan a 7-day adventure in New Zealand')"
                      className="command-input"
                      disabled={isProcessing}
                    />
                    
                    <div className="input-actions">
                      <motion.button
                        className={cn("voice-button", isVoiceActive && "active")}
                        onClick={toggleVoiceInput}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isVoiceActive ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                      </motion.button>
                      
                      <motion.button
                        className="send-button"
                        onClick={() => processCommand()}
                        disabled={!inputText.trim() || isProcessing}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Send className="h-5 w-5" />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Quick Commands */}
                <div className="quick-commands">
                  <div className="quick-commands-label">Quick Mission Templates:</div>
                  <div className="quick-commands-grid">
                    {quickCommands.map((command, index) => (
                      <motion.button
                        key={index}
                        className="quick-command-button"
                        onClick={() => {
                          setInputText(command);
                          inputRef.current?.focus();
                        }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {command}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </HolographicCard>
            </motion.div>
          )}

          {/* Explore Mode - Enhanced Map */}
          {activeMode === 'explore' && currentTrip && (
            <motion.div 
              className="explore-center"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
            >
              <HolographicCard className="map-panel full-screen">
                <div className="panel-header">
                  <h3>Mission Map - {currentTrip.destination}</h3>
                  <div className="map-controls">
                    <button className="control-btn">
                      <Eye className="h-4 w-4" />
                      Satellite
                    </button>
                    <button className="control-btn">
                      <Layers className="h-4 w-4" />
                      Layers
                    </button>
                    <button className="control-btn">
                      <Navigation className="h-4 w-4" />
                      Route
                    </button>
                  </div>
                </div>
                
                <ProductionMapView
                  activities={currentTrip.dailyItineraries?.flatMap((day, dayIndex) => 
                    day.activities?.map(activity => ({ ...activity, dayIndex })) || []
                  ) || []}
                  height="calc(100vh - 200px)"
                  className="futuristic-map"
                  showControls={true}
                  enableRouting={true}
                  enableGeolocation={true}
                />
              </HolographicCard>
            </motion.div>
          )}

          {/* Create Mode */}
          {activeMode === 'create' && (
            <motion.div 
              className="create-center"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -100 }}
            >
              <HolographicCard className="create-panel">
                <div className="panel-header">
                  <h3>Mission Designer</h3>
                  <div className="design-tools">
                    <button className="tool-btn">
                      <Calendar className="h-4 w-4" />
                    </button>
                    <button className="tool-btn">
                      <MapPin className="h-4 w-4" />
                    </button>
                    <button className="tool-btn">
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="create-content">
                  <p className="text-center text-muted-foreground">
                    Advanced trip designer coming soon...
                    <br />
                    Use Command mode to create trips instantly!
                  </p>
                </div>
              </HolographicCard>
            </motion.div>
          )}

          {/* Analyze Mode */}
          {activeMode === 'analyze' && (
            <motion.div 
              className="analyze-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <HolographicCard className="analyze-panel">
                <div className="panel-header">
                  <h3>Mission Analytics</h3>
                </div>
                
                <div className="analyze-content">
                  <p className="text-center text-muted-foreground">
                    Advanced analytics dashboard coming soon...
                    <br />
                    Real-time travel insights and optimization!
                  </p>
                </div>
              </HolographicCard>
            </motion.div>
          )}
          
        </div>
      </div>
    </div>
  );
};

// Trip Preview Card Component
const TripPreviewCard = ({ trip }) => {
  return (
    <motion.div 
      className="trip-preview-card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="trip-header">
        <div className="trip-destination">
          <Globe className="h-5 w-5" />
          <span>{trip.destination}</span>
        </div>
        <div className="trip-duration">
          <Calendar className="h-4 w-4" />
          <span>
            {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      {trip.dailyItineraries && (
        <div className="trip-stats">
          <div className="stat">
            <span className="stat-value">{trip.dailyItineraries.length}</span>
            <span className="stat-label">Days</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {trip.dailyItineraries.reduce((total, day) => total + (day.activities?.length || 0), 0)}
            </span>
            <span className="stat-label">Activities</span>
          </div>
          <div className="stat">
            <span className="stat-value">${trip.estimatedCost || '0'}</span>
            <span className="stat-label">Budget</span>
          </div>
        </div>
      )}

      <div className="trip-actions">
        <button className="action-btn primary">
          <MapPin className="h-4 w-4" />
          Explore
        </button>
        <button className="action-btn">
          <Download className="h-4 w-4" />
          Export
        </button>
        <button className="action-btn">
          <Share className="h-4 w-4" />
          Share
        </button>
      </div>
    </motion.div>
  );
};

export default FuturisticInterface; 