// Backend Ollama Service - Free Local LLM
// Replaces OpenAI API with free local inference

const axios = require('axios');

class OllamaService {
  constructor() {
    this.baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3.1:8b';
    this.isAvailable = false;
    this.checkAvailability();
  }

  async checkAvailability() {
    try {
      const response = await axios.get(`${this.baseURL}/api/version`, { timeout: 5000 });
      this.isAvailable = response.status === 200;
      console.log('🦙 Ollama availability:', this.isAvailable);
      if (this.isAvailable) {
        console.log('🦙 Ollama is ready for local LLM inference!');
      }
    } catch (error) {
      this.isAvailable = false;
      console.warn('⚠️ Ollama not available:', error.message);
      console.log('💡 To start Ollama: ollama serve');
      console.log('💡 To download model: ollama pull llama3.1:8b');
    }
  }

  async chat(messages, options = {}) {
    if (!this.isAvailable) {
      await this.checkAvailability();
      if (!this.isAvailable) {
        throw new Error('Ollama service not available. Please start Ollama server with: ollama serve');
      }
    }

    try {
      const payload = {
        model: this.model,
        messages: messages,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.maxTokens || 2000,
          top_p: options.topP || 0.9,
          ...options
        }
      };

      console.log(`🦙 Sending request to Ollama (${this.model})...`);
      const response = await axios.post(`${this.baseURL}/api/chat`, payload, {
        timeout: 120000 // 2 minutes timeout for LLM generation
      });

      return {
        content: response.data.message.content,
        usage: {
          prompt_tokens: response.data.prompt_eval_count || 0,
          completion_tokens: response.data.eval_count || 0,
          total_tokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0)
        },
        model: this.model
      };
    } catch (error) {
      console.error('🚨 Ollama chat error:', error.message);
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama server not running. Please start with: ollama serve');
      }
      throw error;
    }
  }

  async generateTripPlan(destination, duration, interests, budget) {
    const systemPrompt = `You are an expert travel planner. Create comprehensive, realistic travel itineraries with specific locations, times, and practical details. Always respond with valid JSON format. Be precise with coordinates and use real place names.`;
    
    const userPrompt = `Create a ${duration}-day travel itinerary for ${destination} with ${budget} budget. 
    
Interests: ${interests.join(', ')}.

Requirements:
- Use REAL restaurant names and addresses in ${destination}
- Include specific museum names with realistic hours
- Add transportation details between locations
- Make timing realistic (account for travel time)
- Include costs in local currency
- Add practical local tips

Return ONLY valid JSON with this structure:
{
  "destination": "${destination}",
  "title": "Descriptive title",
  "duration": ${duration},
  "estimatedCost": 0,
  "budget": "${budget}",
  "dailyItineraries": [
    {
      "day": 1,
      "date": "2024-06-01",
      "theme": "Day theme",
      "totalBudget": 0,
      "activities": [
        {
          "name": "REAL place name",
          "time": "HH:MM",
          "duration": 60,
          "location": "Full address",
          "latitude": 0.0,
          "longitude": 0.0,
          "category": "dining|sightseeing|culture|entertainment|shopping|nature",
          "description": "Detailed description",
          "cost": 0,
          "tips": "Practical local tips",
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
      console.log(`🦙 Generating ${duration}-day trip plan for ${destination}...`);
      const response = await this.chat(messages, {
        temperature: 0.7,
        maxTokens: 4000
      });

      // Try to parse JSON from response
      let jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log(`✅ Generated trip plan with ${parsed.dailyItineraries?.length || 0} days`);
          return parsed;
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error('Invalid JSON response from LLM');
        }
      } else {
        console.error('No JSON found in LLM response:', response.content.substring(0, 200));
        throw new Error('No JSON found in LLM response');
      }
    } catch (error) {
      console.error('Trip generation error:', error);
      throw error;
    }
  }

  async answerTravelQuestion(question, context = {}) {
    const systemPrompt = `You are a helpful travel assistant with extensive knowledge of destinations worldwide. Provide practical, accurate travel advice. Be concise but informative.`;
    
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
      const response = await axios.get(`${this.baseURL}/api/tags`);
      return response.data.models || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  }

  async pullModel(modelName) {
    try {
      console.log(`🦙 Pulling model: ${modelName}...`);
      const response = await axios.post(`${this.baseURL}/api/pull`, 
        { name: modelName },
        { timeout: 300000 } // 5 minutes timeout for model download
      );
      console.log(`✅ Model ${modelName} pulled successfully`);
      return true;
    } catch (error) {
      console.error('Error pulling model:', error);
      throw error;
    }
  }

  setModel(modelName) {
    this.model = modelName;
    console.log(`🦙 Switched to model: ${modelName}`);
  }

  getStatus() {
    return {
      available: this.isAvailable,
      baseURL: this.baseURL,
      currentModel: this.model,
      provider: 'ollama'
    };
  }
}

module.exports = new OllamaService(); 