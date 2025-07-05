// Enhanced AI Service for TripTactician Pro
// Add this to src/services/aiService.js

import OpenAI from 'openai';
import { useState, useRef, useCallback } from 'react';

class EnhancedAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Only for demo - use backend in production
    });
    
    this.conversationHistory = [];
    this.userPreferences = {};
    this.currentItinerary = null;
  }

  // Initialize conversation with context
  initializeConversation(userPreferences, destination, existingItinerary = null) {
    this.userPreferences = userPreferences;
    this.currentItinerary = existingItinerary;
    
    const systemPrompt = `You are TripTactician Pro's AI travel assistant. You're helping plan a trip to ${destination}.

User preferences:
- Interests: ${userPreferences.interests?.join(', ') || 'Not specified'}
- Budget: ${userPreferences.budget || 'Not specified'}
- Travel style: ${userPreferences.travelStyle || 'Not specified'}
- Group size: ${userPreferences.groupSize || 'Not specified'}

Your role:
1. Provide personalized travel recommendations
2. Modify existing itineraries based on user requests
3. Answer questions about the destination
4. Suggest practical travel tips
5. Be enthusiastic and helpful

Always respond in a friendly, conversational tone. When suggesting changes to itineraries, provide specific, actionable recommendations with times, locations, and practical details.`;

    this.conversationHistory = [
      { role: 'system', content: systemPrompt }
    ];
  }

  // Stream AI responses for better UX
  async *streamResponse(userMessage, onChunk) {
    try {
      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage
      });

      const stream = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: this.conversationHistory,
        stream: true,
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { "type": "text" } // Ensure plain text response by default
      });

      let fullResponse = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          if (onChunk) onChunk(content);
          yield content;
        }
      }

      // Add AI response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: fullResponse
      });

      return fullResponse;

    } catch (error) {
      console.error('AI Stream Error:', error);
      throw new Error('Failed to get AI response. Please try again.');
    }
  }

  // Generate smart suggestions based on context
  generateSmartSuggestions(currentContext) {
    const suggestions = [];
    
    if (currentContext.timeOfDay === 'morning') {
      suggestions.push("What's a good breakfast spot nearby?");
      suggestions.push("Add some morning activities");
    } else if (currentContext.timeOfDay === 'evening') {
      suggestions.push("Suggest dinner and nightlife options");
      suggestions.push("What are some evening cultural activities?");
    }

    if (this.userPreferences.interests?.includes('Food')) {
      suggestions.push("Find local food markets and cooking classes");
      suggestions.push("What are the must-try local dishes?");
    }

    if (this.userPreferences.budget === 'budget') {
      suggestions.push("Show me free activities and attractions");
      suggestions.push("How can I save money on this trip?");
    }

    suggestions.push("Optimize my itinerary for less travel time");
    suggestions.push("Add some hidden gems to my trip");
    suggestions.push("What should I pack for this destination?");

    return suggestions.slice(0, 6); // Return max 6 suggestions
  }

  // Analyze sentiment and extract intent
  analyzeUserIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    const intents = {
      modify: /change|modify|update|replace|remove|delete|swap/.test(lowerMessage),
      add: /add|include|insert|more|extra|another/.test(lowerMessage),
      time: /time|schedule|when|duration|how long/.test(lowerMessage),
      location: /where|location|address|directions|how to get/.test(lowerMessage),
      budget: /cost|price|expensive|cheap|budget|money/.test(lowerMessage),
      food: /food|restaurant|eat|dining|meal|cuisine/.test(lowerMessage),
      weather: /weather|temperature|rain|sunny|climate/.test(lowerMessage),
      transport: /transport|travel|flight|train|bus|car|uber/.test(lowerMessage)
    };

    return Object.keys(intents).filter(intent => intents[intent]);
  }

  // Generate contextual responses with structured data
  async generateContextualResponse(userMessage) {
    const intent = this.analyzeUserIntent(userMessage);
    
    let prompt = userMessage;
    
    // If the intent is to modify the itinerary, explicitly ask for JSON output
    if (intent.includes('modify') || intent.includes('add') || intent.includes('remove') || intent.includes('time')) {
      prompt += `\n\nIf you are suggesting itinerary changes, please respond with a JSON object in addition to your conversational response. The JSON object should be a string (escaped if necessary) and contain an array of 'additions', 'modifications', and 'removals'.
      Example JSON structure:
      \`\`\`json
      {
        "additions": [
          { "day": 1, "activity": { "name": "New Museum", "time": "10:00", "location": "Museum Address", "category": "culture", "description": "", "latitude": 0, "longitude": 0 } }
        ],
        "modifications": [
          { "day": 1, "activityId": "<activity_id>", "updates": { "time": "11:00", "cost": "$50" } }
        ],
        "removals": [
          { "day": 2, "activityId": "<activity_id>" }
        ]
      }
      \`\`\`
      Embed this JSON string directly in your response within <ITINERARY_CHANGES> tags. If no changes, omit the tags.
      Current itinerary context: ${JSON.stringify(this.currentItinerary?.dailyItineraries || [], null, 2)}`;
    }

    if (intent.includes('budget')) {
      prompt += `\n\nUser's budget preference: ${this.userPreferences.budget}`;
    }

    const responseStream = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [...this.conversationHistory, { role: 'user', content: prompt }],
      stream: true,
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { "type": "text" }
    });

    let fullAIResponse = '';
    for await (const chunk of responseStream) {
      fullAIResponse += chunk.choices[0]?.delta?.content || '';
    }

    // Add AI response to history
    this.conversationHistory.push({
      role: 'assistant',
      content: fullAIResponse
    });

    return fullAIResponse;
  }

  // Extract actionable data from AI responses
  extractItineraryChanges(aiResponse) {
    const changes = {
      additions: [],
      modifications: [],
      removals: [],
      timeChanges: [] // Not directly used yet, but keep for future
    };

    const jsonRegex = /<ITINERARY_CHANGES>([^\s]*?)<\/ITINERARY_CHANGES>/;
    const match = aiResponse.match(jsonRegex);

    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.additions) changes.additions = parsed.additions;
        if (parsed.modifications) changes.modifications = parsed.modifications;
        if (parsed.removals) changes.removals = parsed.removals;
        // Add timeChanges if you define them in the JSON schema
      } catch (e) {
        console.error("Failed to parse itinerary changes JSON:", e);
      }
    }
    return changes;
  }

  // Get conversation summary for persistence
  getConversationSummary() {
    return {
      messageCount: this.conversationHistory.length - 1, // Exclude system message
      lastUpdated: new Date().toISOString(),
      userPreferences: this.userPreferences,
      keyTopics: this.extractKeyTopics()
    };
  }

  extractKeyTopics() {
    const allMessages = this.conversationHistory
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join(' ');

    // Simple keyword extraction (can be enhanced)
    const topicWords = allMessages.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const wordFreq = {};
    
    topicWords.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  // Generate trip insights
  async generateTripInsights(itinerary) {
    const prompt = `Analyze this travel itinerary and provide 3-5 key insights about the trip:

${JSON.stringify(itinerary, null, 2)}

Provide insights about:
1. Trip pacing and balance
2. Cost optimization opportunities
3. Cultural experiences
4. Logistical considerations
5. Missing experiences

Format as a JSON array of insight objects with 'type', 'title', and 'description' fields.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { "type": "json_object" }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Insights generation error:', error);
      return [];
    }
  }

  // Clear conversation (for new trip planning)
  resetConversation() {
    this.conversationHistory = [];
    this.userPreferences = {};
    this.currentItinerary = null;
  }
}

// Enhanced React Hook for AI Integration
export const useEnhancedAI = () => {
  const aiServiceRef = useRef(new EnhancedAIService());
  const [conversationHistory, setConversationHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const initializeForTrip = useCallback((userPreferences, destination, currentItinerary) => {
    aiServiceRef.current.initializeConversation(userPreferences, destination, currentItinerary);
    setConversationHistory(aiServiceRef.current.conversationHistory);
  }, []);

  const sendMessage = useCallback(async (message) => {
    setLoading(true);
    setError(null);
    try {
      const onChunk = (chunk) => {
        // Update UI with streaming content if needed, e.g., by updating a state holding the current AI response
        // For now, we'll just wait for the full response
      };
      const fullResponse = await aiServiceRef.current.streamResponse(message, onChunk);
      setConversationHistory(aiServiceRef.current.conversationHistory);
      return fullResponse; // Return the full response for further processing (e.g., itinerary extraction)
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSmartSuggestions = useCallback((context) => {
    return aiServiceRef.current.generateSmartSuggestions(context);
  }, []);

  const generateInsights = useCallback(async (itinerary) => {
    setLoading(true);
    setError(null);
    try {
      const insights = await aiServiceRef.current.generateTripInsights(itinerary);
      return insights;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const extractItineraryChanges = useCallback((aiResponse) => {
    return aiServiceRef.current.extractItineraryChanges(aiResponse);
  }, []);

  const resetConversation = useCallback(() => {
    aiServiceRef.current.resetConversation();
    setConversationHistory([]);
  }, []);

  return {
    conversationHistory,
    sendMessage,
    initializeForTrip,
    getSmartSuggestions,
    loading,
    error,
    generateInsights,
    extractItineraryChanges,
    resetConversation,
  };
};

export default EnhancedAIService;