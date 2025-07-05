// Ollama Local LLM Service
// Free alternative to OpenAI API using local LLM inference

const OLLAMA_BASE_URL = process.env.REACT_APP_OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.REACT_APP_OLLAMA_MODEL || 'llama3.1:8b';

class OllamaService {
  constructor() {
    this.baseURL = OLLAMA_BASE_URL;
    this.model = DEFAULT_MODEL;
    this.isAvailable = false;
    this.checkAvailability();
  }

  async checkAvailability() {
    try {
      const response = await fetch(`${this.baseURL}/api/version`);
      this.isAvailable = response.ok;
      console.log('Ollama availability:', this.isAvailable);
    } catch (error) {
      this.isAvailable = false;
      console.warn('Ollama not available:', error.message);
    }
  }

  async chat(messages, options = {}) {
    if (!this.isAvailable) {
      await this.checkAvailability();
      if (!this.isAvailable) {
        throw new Error('Ollama service not available. Please start Ollama server.');
      }
    }

    try {
      const payload = {
        model: this.model,
        messages: messages,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2000,
          top_p: options.topP || 0.9,
          ...options
        }
      };

      const response = await fetch(`${this.baseURL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return {
        content: data.message.content,
        usage: {
          prompt_tokens: data.prompt_eval_count || 0,
          completion_tokens: data.eval_count || 0,
          total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
        },
        model: this.model
      };
    } catch (error) {
      console.error('Ollama chat error:', error);
      throw error;
    }
  }

  async generateTripPlan(destination, duration, interests, budget) {
    const systemPrompt = `You are an expert travel planner. Create comprehensive, realistic travel itineraries with specific locations, times, and practical details. Always respond with valid JSON format.`;
    
    const userPrompt = `Create a ${duration}-day travel itinerary for ${destination} with ${budget} budget. Interests: ${interests.join(', ')}.

Include:
- Specific restaurant names and addresses
- Museum hours and ticket prices
- Transportation details
- Daily budgets
- Local tips

Format as JSON with this structure:
{
  "destination": "${destination}",
  "title": "Descriptive title",
  "duration": ${duration},
  "estimatedCost": 0,
  "budget": "${budget}",
  "dailyItineraries": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "Day theme",
      "totalBudget": 0,
      "activities": [
        {
          "name": "Activity name",
          "time": "HH:MM",
          "duration": 60,
          "location": "Specific address",
          "latitude": 0.0,
          "longitude": 0.0,
          "category": "dining|sightseeing|culture|entertainment",
          "description": "Detailed description",
          "cost": 0,
          "tips": "Local tips",
          "bookingRequired": false
        }
      ]
    }
  ]
}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const response = await this.chat(messages, {
        temperature: 0.7,
        maxTokens: 4000
      });

      // Try to parse JSON from response
      let jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error('Invalid JSON response from LLM');
        }
      } else {
        throw new Error('No JSON found in LLM response');
      }
    } catch (error) {
      console.error('Trip generation error:', error);
      throw error;
    }
  }

  async answerTravelQuestion(question, context = {}) {
    const systemPrompt = `You are a helpful travel assistant. Provide practical, accurate travel advice. Be concise but informative.`;
    
    const contextStr = Object.keys(context).length > 0 
      ? `Context: ${JSON.stringify(context)}\n\n` 
      : '';
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${contextStr}Question: ${question}` }
    ];

    try {
      const response = await this.chat(messages, {
        temperature: 0.6,
        maxTokens: 1000
      });

      return response.content;
    } catch (error) {
      console.error('Travel question error:', error);
      throw error;
    }
  }

  async getAvailableModels() {
    try {
      const response = await fetch(`${this.baseURL}/api/tags`);
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }
      
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  }

  async pullModel(modelName) {
    try {
      const response = await fetch(`${this.baseURL}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: modelName })
      });

      if (!response.ok) {
        throw new Error(`Failed to pull model: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error pulling model:', error);
      throw error;
    }
  }

  setModel(modelName) {
    this.model = modelName;
  }

  getStatus() {
    return {
      available: this.isAvailable,
      baseURL: this.baseURL,
      currentModel: this.model
    };
  }
}

export default new OllamaService(); 