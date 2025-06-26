import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Bot, User, Sparkles, MapPin, Calendar, Clock, Heart, Edit3, Trash2, Plus, Check, X } from 'lucide-react';
import './AIConversation.css';

const AIConversation = ({ onItineraryUpdate, initialItinerary }) => {
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
    scrollToBottom();
  }, [messages]);

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

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Simulate AI response (replace with actual API call)
      const aiResponse = await generateAIResponse(inputMessage, currentItinerary);
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse.content,
        timestamp: new Date(),
        suggestions: aiResponse.suggestions || [],
        itineraryChanges: aiResponse.itineraryChanges || null
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Update itinerary if changes were made
      if (aiResponse.itineraryChanges) {
        const updatedItinerary = applyItineraryChanges(currentItinerary, aiResponse.itineraryChanges);
        setCurrentItinerary(updatedItinerary);
        onItineraryUpdate(updatedItinerary);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateAIResponse = async (userInput, itinerary) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const lowerInput = userInput.toLowerCase();
    
    // Simple response logic (replace with actual OpenAI API call)
    if (lowerInput.includes('museum') || lowerInput.includes('art')) {
      return {
        content: "Great choice! I've added some amazing museums and art galleries to your itinerary. The Louvre and Musée d'Orsay are must-visits in Paris. I've also included some smaller, hidden gems that locals love.",
        suggestions: ["Add more cultural sites", "Show me the updated itinerary", "What about outdoor activities?"],
        itineraryChanges: {
          type: 'add_activities',
          day: 1,
          activities: [
            {
              time: '10:00',
              name: 'Louvre Museum',
              description: 'World-famous art museum with the Mona Lisa',
              location: 'Rue de Rivoli, Paris',
              duration: '3 hours',
              cost: '$17',
              tips: 'Book tickets online to skip the queue',
              category: 'museum'
            },
            {
              time: '14:00',
              name: 'Musée d\'Orsay',
              description: 'Impressionist and post-impressionist masterpieces',
              location: '1 Rue de la Légion d\'Honneur, Paris',
              duration: '2.5 hours',
              cost: '$16',
              tips: 'Visit on Thursday for extended hours',
              category: 'museum'
            }
          ]
        }
      };
    } else if (lowerInput.includes('food') || lowerInput.includes('restaurant')) {
      return {
        content: "I've updated your itinerary with some incredible local dining experiences! I've added authentic French bistros, a food market tour, and some hidden gems that tourists often miss.",
        suggestions: ["Show me the food itinerary", "Add more budget options", "What about wine tasting?"],
        itineraryChanges: {
          type: 'add_activities',
          day: 2,
          activities: [
            {
              time: '12:00',
              name: 'Le Comptoir du Relais',
              description: 'Authentic French bistro with seasonal menu',
              location: '9 Carrefour de l\'Odéon, Paris',
              duration: '1.5 hours',
              cost: '$45',
              tips: 'Reservation recommended',
              category: 'restaurant'
            },
            {
              time: '18:00',
              name: 'Marché des Enfants Rouges',
              description: 'Historic covered market with diverse food stalls',
              location: '39 Rue de Bretagne, Paris',
              duration: '2 hours',
              cost: '$25',
              tips: 'Perfect for dinner and people watching',
              category: 'food_market'
            }
          ]
        }
      };
    } else if (lowerInput.includes('budget') || lowerInput.includes('cheap')) {
      return {
        content: "I've optimized your itinerary for budget-conscious travelers! I've replaced expensive activities with equally amazing but more affordable options, and added some free attractions that are just as impressive.",
        suggestions: ["Show me budget-friendly activities", "What about free attractions?", "Keep the luxury options"],
        itineraryChanges: {
          type: 'modify_costs',
          changes: [
            { day: 1, activityIndex: 0, newCost: '$12' },
            { day: 1, activityIndex: 1, newCost: '$8' }
          ]
        }
      };
    } else {
      return {
        content: "I understand you'd like to modify your itinerary. I can help you add activities, change dates, adjust your budget, or suggest new places to visit. What specific changes would you like to make?",
        suggestions: ["Add museums and galleries", "Show me outdoor activities", "I want budget-friendly options", "Add local food experiences"]
      };
    }
  };

  const applyItineraryChanges = (itinerary, changes) => {
    if (!itinerary) return itinerary;

    const updatedItinerary = { ...itinerary };

    if (changes.type === 'add_activities') {
      if (!updatedItinerary.dailyItineraries) {
        updatedItinerary.dailyItineraries = [];
      }
      
      if (!updatedItinerary.dailyItineraries[changes.day - 1]) {
        updatedItinerary.dailyItineraries[changes.day - 1] = {
          day: changes.day,
          date: new Date().toLocaleDateString(),
          theme: `Day ${changes.day}`,
          activities: []
        };
      }

      updatedItinerary.dailyItineraries[changes.day - 1].activities.push(...changes.activities);
    } else if (changes.type === 'modify_costs') {
      changes.changes.forEach(change => {
        if (updatedItinerary.dailyItineraries[change.day - 1]?.activities[change.activityIndex]) {
          updatedItinerary.dailyItineraries[change.day - 1].activities[change.activityIndex].cost = change.newCost;
        }
      });
    }

    return updatedItinerary;
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
            onClick={() => onItineraryUpdate(currentItinerary)}
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
          {messages.map((message) => (
            <motion.div
              key={message.id}
              className={`message ${message.type}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="message-avatar">
                {message.type === 'ai' ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className="message-content">
                <div className="message-text">{message.content}</div>
                <div className="message-timestamp">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="message-suggestions">
                    {message.suggestions.map((suggestion, index) => (
                      <motion.button
                        key={index}
                        className="suggestion-btn"
                        onClick={() => handleSuggestionClick(suggestion)}
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