import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Bot, User, Sparkles, MapPin, Calendar, Clock, Heart, Edit3, Trash2, Plus, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { useEnhancedAI } from '../services/aiService';
import { toast } from 'react-hot-toast';
import './AIConversation.css';

const AIConversation = ({ onItineraryUpdate, initialItinerary }) => {
  const { user } = useAuth();
  const { currentTrip, updateExistingTrip } = useTrip();
  const { conversationHistory, sendMessage, initializeForTrip, getSmartSuggestions, loading, error, resetConversation, extractItineraryChanges } = useEnhancedAI();
  
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentItinerary, setCurrentItinerary] = useState(initialItinerary || null);
  const [suggestions, setSuggestions] = useState([
    "I want to visit museums and art galleries",
    "Can you add more outdoor activities?",
    "I prefer budget-friendly options",
    "Show me local food recommendations",
    "I want to change the dates",
    "Add more cultural experiences"
  ]);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (user && currentTrip) {
      initializeForTrip(user.travelPreferences, currentTrip.destination, currentTrip);
    }
    return () => {
      resetConversation();
    };
  }, [user, currentTrip]);

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory]);

  useEffect(() => {
    // Initialize conversation
    if (!messages.length) {
      const welcomeMessage = {
        id: 1,
        type: 'ai',
        content: `Hi! I'm your AI travel assistant. I can help you plan and modify your trip to ${initialItinerary?.destination || 'your destination'}. 

What would you like to change or add to your itinerary? I can:
• Add or remove activities
• Change dates and times
• Suggest new places to visit
• Modify your budget preferences
• Add cultural experiences
• Recommend local food spots

Just tell me what you have in mind!`,
        timestamp: new Date(),
        suggestions: suggestions.slice(0, 4)
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() === '') return;

    const userMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);
    
    // Immediately add user message to local history for quick display
    // (the useEnhancedAI hook will eventually add it to its internal history)
    // This local state is only for immediate UI feedback.
    // conversationHistory from useEnhancedAI is the source of truth.
    
    const generatedSuggestions = getSmartSuggestions({ 
      timeOfDay: new Date().getHours() < 12 ? 'morning' : 'evening',
      interests: user?.travelPreferences?.interests || []
    });
    setSuggestions(generatedSuggestions);

    try {
      const response = await sendMessage(userMessage);
      
      // Attempt to extract structured itinerary changes
      const changes = extractItineraryChanges(response);

      if (changes && (changes.additions.length > 0 || changes.modifications.length > 0 || changes.removals.length > 0 || changes.timeChanges.length > 0)) {
        console.log("Detected itinerary changes:", changes);
        // Call a function to apply these changes to the currentTrip via TripContext
        await applyItineraryChanges(changes);
        toast.success('Itinerary updated based on AI suggestions!');
      }

    } catch (err) {
      console.error('Error sending message:', err);
      toast.error(error || 'Failed to get AI response. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const applyItineraryChanges = async (changes) => {
    if (!currentTrip) return;

    let updatedDailyItineraries = [...currentTrip.dailyItineraries];

    // Handle additions
    changes.additions.forEach(add => {
      const dayIndex = add.day - 1;
      if (updatedDailyItineraries[dayIndex]) {
        updatedDailyItineraries[dayIndex].activities.push(add.activity);
      } else {
        // Create new day if it doesn't exist (e.g., AI suggests activity for a future day)
        updatedDailyItineraries[dayIndex] = {
          day: add.day,
          date: new Date().toISOString(), // Placeholder, ideally get from AI or trip dates
          theme: `Day ${add.day} activities`,
          activities: [add.activity]
        };
        updatedDailyItineraries.sort((a, b) => a.day - b.day); // Keep sorted by day
      }
    });

    // Handle modifications
    changes.modifications.forEach(mod => {
      const dayIndex = mod.day - 1;
      if (updatedDailyItineraries[dayIndex]) {
        updatedDailyItineraries[dayIndex].activities = updatedDailyItineraries[dayIndex].activities.map(activity => {
          if (activity._id === mod.activityId) {
            return { ...activity, ...mod.updates };
          }
          return activity;
        });
      }
    });

    // Handle removals
    changes.removals.forEach(rem => {
      const dayIndex = rem.day - 1;
      if (updatedDailyItineraries[dayIndex]) {
        updatedDailyItineraries[dayIndex].activities = updatedDailyItineraries[dayIndex].activities.filter(activity =>
          activity._id !== rem.activityId
        );
      }
    });

    // Send the updated trip to the backend via TripContext
    const result = await updateExistingTrip(String(currentTrip._id), { dailyItineraries: updatedDailyItineraries });
    if (!result.success) {
      toast.error(result.error || 'Failed to save itinerary changes.');
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const toggleVoiceInput = () => {
    setIsListening(!isListening);
    // Add voice recognition logic here
  };

  return (
    <div className="ai-conversation">
      <div className="conversation-header">
        <div className="header-content">
          <div className="ai-avatar">
            <Bot size={24} />
          </div>
          <div className="header-info">
            <h3>AI Travel Assistant</h3>
            <span className="status">
              {isTyping ? 'Typing...' : isListening ? 'Listening...' : 'Online'}
            </span>
          </div>
        </div>
        <div className="header-actions">
          <motion.button
            className="action-btn"
            onClick={(e) => { e.preventDefault(); handleSendMessage(e); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Check size={16} />
            Apply Changes
          </motion.button>
        </div>
      </div>

      <div className="messages-container">
        <AnimatePresence>
          {conversationHistory.map((msg, index) => (
            <motion.div
              key={msg.id}
              className={`message ${msg.role}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="message-avatar">
                {msg.role === 'ai' ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className="message-content">
                <div className="message-text">{msg.content}</div>
                <div className="message-timestamp">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="message-suggestions">
                    {msg.suggestions.map((suggestion, index) => (
                      <motion.button
                        key={index}
                        className="suggestion-btn"
                        onClick={(e) => { e.preventDefault(); handleSuggestionClick(suggestion); }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {suggestion}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            className="message ai typing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="message-avatar">
              <Bot size={20} />
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me what you'd like to change about your trip..."
            rows={1}
            className="message-input"
          />
          <div className="input-actions">
            <motion.button
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              onClick={toggleVoiceInput}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </motion.button>
            <motion.button
              className="send-btn"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send size={18} />
            </motion.button>
          </div>
        </div>
        
        <div className="quick-suggestions">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={index}
              className="quick-suggestion"
              onClick={() => handleSuggestionClick(suggestion)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {suggestion}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIConversation; 