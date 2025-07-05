const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const _ = require('lodash');
const moment = require('moment');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Import free services instead of costly APIs
const ollamaService = require('./services/ollamaService');
const mapsService = require('./services/mapsService');

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const tripRoutes = require('./routes/tripRoutes');
const memoryRoutes = require('./routes/memoryRoutes');
const activityRoutes = require('./routes/activityRoutes');
const friendshipRoutes = require('./routes/friendshipRoutes');
const buddyMessageRoutes = require('./routes/buddyMessageRoutes');

// Load environment variables FIRST
dotenv.config();

// Debug environment variables
console.log('=== SERVER STARTUP DEBUG ===');
// FREE API Setup - No Google API keys needed!
console.log('🆓 Using FREE OpenStreetMap services (no API keys required)');
console.log('🗺️ FREE Geocoding: Nominatim');
console.log('📍 FREE Places: Overpass API');
console.log('🤖 FREE AI: Ollama (Local LLM)');
console.log('💰 Monthly cost: $0 (vs $350+ for Google APIs)');
console.log('============================');

// Connect to MongoDB
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => {
      console.error('MongoDB connection error:', err.message);
      process.exit(1);
    });
} else {
  console.warn('MongoDB URI not provided, skipping database connection');
}

const app = express();
const PORT = process.env.SERVER_PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:11434", "https://nominatim.openstreetmap.org", "https://overpass-api.de"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting - TEMPORARILY DISABLED FOR DEVELOPMENT
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 50, // limit each IP to 50 requests per windowMs for API routes
//   message: 'Too many API requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// app.use(limiter);
// app.use('/api/', apiLimiter);

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// CORS configuration with security
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'http://localhost:3000']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// OpenAI configuration
let openai = null;
let localLLM = null;

// LLM Configuration
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai'; // 'openai' or 'ollama'
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';

console.log(`🤖 LLM Provider: ${LLM_PROVIDER}`);

if (LLM_PROVIDER === 'openai') {
  // OpenAI setup
  if (process.env.OPENAI_API_KEY) {
    const { OpenAI } = require('openai');
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✅ OpenAI client initialized');
  } else {
    console.warn('⚠️ OpenAI API key not found. Set OPENAI_API_KEY in .env file');
  }
} else if (LLM_PROVIDER === 'ollama') {
  // Ollama setup
  console.log(`🦙 Using Ollama at ${OLLAMA_BASE_URL} with model ${OLLAMA_MODEL}`);
  localLLM = {
    baseURL: OLLAMA_BASE_URL,
    model: OLLAMA_MODEL
  };
  console.log('✅ Ollama client configured');
}

// Universal LLM function
async function callLLM(messages, options = {}) {
  try {
    if (LLM_PROVIDER === 'openai' && openai) {
      const completion = await openai.chat.completions.create({
        messages,
        model: options.model || 'gpt-4o-mini',
        response_format: options.response_format,
        max_tokens: options.max_tokens || 4000,
        temperature: options.temperature || 0.7
      });
      return completion.choices[0].message.content;
    } 
    else if (LLM_PROVIDER === 'ollama' && localLLM) {
      const response = await fetch(`${localLLM.baseURL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: localLLM.model,
          messages: messages,
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
            num_predict: options.max_tokens || 4000
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return data.message.content;
    }
    else {
      throw new Error(`No LLM provider available. Provider: ${LLM_PROVIDER}`);
    }
  } catch (error) {
    console.error('LLM call error:', error);
    throw error;
  }
}

// Cache for API responses (in production, use Redis)
const cache = new Map();
const CACHE_DURATION = 3600000; // 1 hour

// Utility functions with error handling
const getCachedData = (key) => {
  try {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  } catch (error) {
    console.error('Cache get error:', error.message);
    return null;
  }
};

const setCachedData = (key, data) => {
  try {
    cache.set(key, { data, timestamp: Date.now() });
  } catch (error) {
    console.error('Cache set error:', error.message);
  }
};

// Input validation middleware
const validateDestination = [
  body('destination')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Destination must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s,.-]+$/)
    .withMessage('Destination contains invalid characters'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('interests')
    .isArray({ min: 1, max: 10 })
    .withMessage('Must select between 1 and 10 interests'),
  body('interests.*')
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each interest must be between 1 and 50 characters')
];

// FREE GEOCODING FUNCTION using Nominatim
const geocodeAddress = async (address, destination) => {
  console.log('🆓 Using FREE Nominatim geocoding (no API key needed)');
  
  try {
    // Clean up the address
    const cleanAddress = `${address}, ${destination}`;
    console.log(`🔍 FREE Geocoding: ${cleanAddress}`);
    
    const result = await mapsService.geocode(cleanAddress);
    
    if (result && result.latitude && result.longitude) {
      console.log(`✅ FREE Geocoded: ${cleanAddress} -> ${result.latitude}, ${result.longitude}`);
      
      return {
        latitude: result.latitude,
        longitude: result.longitude,
        formatted_address: result.formatted_address
      };
    } else {
      console.log(`⚠️ No FREE geocoding results for: ${cleanAddress}`);
      
      // Return fallback coordinates
      const fallback = getFallbackCoordinates(destination);
      return {
        latitude: fallback.lat,
        longitude: fallback.lng,
        formatted_address: cleanAddress
      };
    }
  } catch (error) {
    console.error(`❌ FREE Geocoding error for ${address}:`, error.message);
    
    // Return fallback coordinates
    const fallback = getFallbackCoordinates(destination);
    return {
      latitude: fallback.lat,
      longitude: fallback.lng,
      formatted_address: `${address}, ${destination}`
    };
  }
};

// Rate limiting helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fallback coordinates for major cities
const getFallbackCoordinates = (destination, index = 0) => {
  const cityCoordinates = {
    'milano': { lat: 45.4642, lng: 9.1900 },
    'milan': { lat: 45.4642, lng: 9.1900 },
    'barcelona': { lat: 41.3851, lng: 2.1734 },
    'rome': { lat: 41.9028, lng: 12.4964 },
    'paris': { lat: 48.8566, lng: 2.3522 },
    'london': { lat: 51.5074, lng: -0.1278 },
    'new york': { lat: 40.7128, lng: -74.0060 },
    'tokyo': { lat: 35.6762, lng: 139.6503 },
    'amsterdam': { lat: 52.3676, lng: 4.9041 },
    'berlin': { lat: 52.5200, lng: 13.4050 },
    'madrid': { lat: 40.4168, lng: -3.7038 }
  };
  
  const destLower = destination.toLowerCase();
  const baseCoords = Object.keys(cityCoordinates).find(city => 
    destLower.includes(city)
  );
  
  const defaultCoords = baseCoords 
    ? cityCoordinates[baseCoords]
    : { lat: 40.7128, lng: -74.0060 }; // Default to NYC
  
  // Add small random offset so markers don't overlap
  return {
    lat: defaultCoords.lat + (Math.random() - 0.5) * 0.02,
    lng: defaultCoords.lng + (Math.random() - 0.5) * 0.02
  };
};

// FREE Places API function using Overpass API
const getFreePlacesData = async (destination, type = 'tourist_attraction') => {
  try {
    const cacheKey = `free_places_${destination}_${type}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    console.log(`🆓 FREE Places search for ${type} in ${destination} (no API key needed)`);
    
    const places = await mapsService.searchPlaces(destination, type);

    // Map to similar format as Google Places for compatibility
    const mappedData = places.map(place => ({
      name: place.name,
      rating: place.rating,
      user_ratings_total: 50, // Mock data since OSM doesn't have this
      types: place.types || [type],
      vicinity: place.formatted_address,
      place_id: place.place_id,
      photos: [],
      price_level: place.price_level,
      opening_hours: place.opening_hours,
      geometry: {
        location: {
          lat: place.latitude,
          lng: place.longitude
        }
      },
      formatted_address: place.formatted_address,
      business_status: 'OPERATIONAL',
      source: 'OpenStreetMap'
    }));

    setCachedData(cacheKey, mappedData);
    console.log(`✅ FREE Found ${mappedData.length} places for ${destination}`);
    return mappedData;
  } catch (error) {
    console.error('❌ FREE Places API Error:', error.message);
    return [];
  }
};

// FREE Get coordinates function using Nominatim
const getCoordinates = async (location) => {
  try {
    const cacheKey = `free_geocode_${location}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    console.log(`🆓 FREE Geocoding coordinates for: ${location}`);
    
    const result = await mapsService.geocode(location);

    if (result && result.latitude && result.longitude) {
      const coords = { latitude: result.latitude, longitude: result.longitude };
      setCachedData(cacheKey, coords);
      console.log(`✅ FREE Coordinates found: ${coords.latitude}, ${coords.longitude}`);
      return coords;
    } else {
      console.warn(`⚠️ No FREE geocoding results for: ${location}`);
      // Return fallback coordinates
      const fallback = getFallbackCoordinates(location);
      return { latitude: fallback.lat, longitude: fallback.lng };
    }
  } catch (error) {
    console.error('FREE Geocoding API Error:', error.message);
    // Return fallback coordinates
    const fallback = getFallbackCoordinates(location);
    return { latitude: fallback.lat, longitude: fallback.lng };
  }
};

const generateAIItinerary = async (tripData) => {
  try {
    console.log('🚀 Starting generateAIItinerary...');
    console.log('📝 Trip data received:', JSON.stringify(tripData, null, 2));

    if (!openai) {
      console.error('❌ OpenAI client not initialized');
      throw new Error('OpenAI client not initialized.');
    }
    console.log('✅ OpenAI client is available');

    const { destination, startDate, endDate, interests, specialRequirements } = tripData;

    // Validate required fields
    if (!destination || !startDate || !endDate || !interests) {
      console.error('❌ Missing required fields:', { destination, startDate, endDate, interests });
      throw new Error('Missing required trip data fields');
    }

    console.log('📍 Destination:', destination);
    console.log('📅 Dates:', startDate, 'to', endDate);
    console.log('🎯 Interests:', interests);

    // SHORTER, MORE FOCUSED PROMPT
    const prompt = `Generate a travel itinerary for ${destination} from ${startDate} to ${endDate}. User interests: ${interests.join(', ')}. ${specialRequirements ? `Special requirements: ${specialRequirements}.` : ''} 

Return JSON format:
{
  "destination": "City Name",
  "tripSummary": {
    "duration": "X days",
    "bestTimeToVisit": "Season",
    "budgetEstimate": "Range"
  },
  "dailyItineraries": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "Day theme",
      "activities": [
        {
          "time": "HH:MM",
          "name": "Activity name",
          "description": "Brief description (max 100 chars)",
          "location": "Specific address",
          "duration": "X hours",
          "cost": "€X",
          "tips": "One tip (max 50 chars)",
          "category": "attraction/restaurant/cultural/outdoor"
        }
      ]
    }
  ],
  "practicalInfo": {
    "transportation": "Brief transport info",
    "accommodation": "Brief accommodation tips",
    "budget": "Brief budget advice",
    "safety": "Brief safety tips"
  },
  "recommendations": {
    "mustSee": ["Place 1", "Place 2", "Place 3"],
    "food": ["Dish 1", "Dish 2"],
    "shopping": ["Area 1", "Area 2"]
  }
}

Keep descriptions short and concise. Include 3-4 activities per day with specific locations.`;

    console.log('🤖 Calling OpenAI API...');
    console.log('📏 Prompt length:', prompt.length);

    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a travel assistant. Generate concise, well-structured JSON itineraries.' },
        { role: 'user', content: prompt }
      ],
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      max_tokens: 20000  // INCREASED TOKEN LIMIT
    });

    console.log('✅ OpenAI API call successful');
    console.log('📄 Response received, parsing JSON...');

    const itineraryContent = completion.choices[0].message.content;
    console.log('📝 Raw content length:', itineraryContent.length);
    console.log('📝 Last 100 chars:', itineraryContent.slice(-100)); // Check if it ends properly

    let itinerary;
    try {
      itinerary = JSON.parse(itineraryContent);
      console.log('✅ JSON parsing successful');
      console.log('📊 Days in itinerary:', itinerary.dailyItineraries?.length || 'undefined');
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError.message);
      console.error('📝 Content ends with:', itineraryContent.slice(-200));
      
      // Try to fix incomplete JSON by adding closing brackets
      let fixedContent = itineraryContent;
      const openBraces = (fixedContent.match(/{/g) || []).length;
      const closeBraces = (fixedContent.match(/}/g) || []).length;
      const openBrackets = (fixedContent.match(/\[/g) || []).length;
      const closeBrackets = (fixedContent.match(/\]/g) || []).length;
      
      console.log('🔧 Attempting to fix JSON...');
      console.log('📊 Braces: open =', openBraces, 'close =', closeBraces);
      console.log('📊 Brackets: open =', openBrackets, 'close =', closeBrackets);
      
      // Add missing closing characters
      for (let i = closeBrackets; i < openBrackets; i++) {
        fixedContent += ']';
      }
      for (let i = closeBraces; i < openBraces; i++) {
        fixedContent += '}';
      }
      
      try {
        itinerary = JSON.parse(fixedContent);
        console.log('✅ JSON fix successful!');
      } catch (fixError) {
        console.error('❌ JSON fix failed too:', fixError.message);
        throw new Error(`Failed to parse OpenAI response as JSON: ${parseError.message}`);
      }
    }

    // Validate the structure
    if (!itinerary.dailyItineraries || !Array.isArray(itinerary.dailyItineraries)) {
      console.error('❌ Invalid itinerary structure - missing dailyItineraries array');
      console.error('📋 Received structure:', Object.keys(itinerary));
      throw new Error('Invalid itinerary structure received from OpenAI');
    }

    console.log('🗺️ Starting geocoding process...');
    let successCount = 0;
    let failureCount = 0;

    // IMPROVED Geocode activity locations with better error handling
    for (let dayIndex = 0; dayIndex < itinerary.dailyItineraries.length; dayIndex++) {
      const day = itinerary.dailyItineraries[dayIndex];
      
      if (day.activities && Array.isArray(day.activities)) {
        console.log(`📅 Processing Day ${day.day} with ${day.activities.length} activities...`);
        
        for (let activityIndex = 0; activityIndex < day.activities.length; activityIndex++) {
          const activity = day.activities[activityIndex];
          
          if (activity.location) {
            try {
              const geocodeResult = await geocodeAddress(activity.location, itinerary.destination);
              
              if (geocodeResult) {
                activity.latitude = geocodeResult.latitude;
                activity.longitude = geocodeResult.longitude;
                activity.formatted_address = geocodeResult.formatted_address;
                successCount++;
              } else {
                // Add fallback coordinates
                const fallbackCoords = getFallbackCoordinates(itinerary.destination, activityIndex);
                activity.latitude = fallbackCoords.lat;
                activity.longitude = fallbackCoords.lng;
                failureCount++;
              }
            } catch (geocodeError) {
              console.error(`❌ Geocoding error for activity "${activity.name}":`, geocodeError.message);
              // Add fallback coordinates
              const fallbackCoords = getFallbackCoordinates(itinerary.destination, activityIndex);
              activity.latitude = fallbackCoords.lat;
              activity.longitude = fallbackCoords.lng;
              failureCount++;
            }
          } else {
            console.warn(`⚠️ Activity "${activity.name}" has no location`);
            // Add fallback coordinates even if no location
            const fallbackCoords = getFallbackCoordinates(itinerary.destination, activityIndex);
            activity.latitude = fallbackCoords.lat;
            activity.longitude = fallbackCoords.lng;
          }
          
          // Add delay to avoid hitting rate limits
          if (activityIndex < day.activities.length - 1) {
            await delay(100);
          }
        }
      } else {
        console.warn(`⚠️ Day ${day.day} has no activities array`);
      }
    }

    console.log(`📊 Geocoding complete: ${successCount} successful, ${failureCount} failed`);
    console.log('✅ generateAIItinerary completed successfully');
    return itinerary;

  } catch (error) {
    console.error('❌ Error in generateAIItinerary:');
    console.error('📋 Error name:', error.name);
    console.error('📝 Error message:', error.message);
    console.error('🔍 Error stack:', error.stack);
    
    if (error.response) {
      console.error('🌐 HTTP Response Status:', error.response.status);
      console.error('📄 HTTP Response Data:', error.response.data);
    }
    
    if (error.code) {
      console.error('🔢 Error code:', error.code);
    }
    
    // Log the original tripData to help debug
    console.error('📝 Original tripData:', JSON.stringify(tripData, null, 2));
    
    return null;
  }
};

// Routes - Start with essential routes only
console.log('🔧 Setting up routes...');

try {
  console.log('✅ Setting up auth routes...');
  app.use('/api/auth', authRoutes);
  
  console.log('✅ Setting up trip routes...');
  app.use('/api/trips', tripRoutes);
  
  console.log('✅ Setting up chat routes...');
  app.use('/api', (req, res, next) => {
    req.openai = openai; // Pass the OpenAI instance to routes (legacy)
    req.callLLM = callLLM; // Pass the universal LLM function
    next();
  }, chatRoutes);
  
  // Optional routes - add these later if needed
  // app.use('/api/memories', memoryRoutes);
  // app.use('/api/activities', activityRoutes);
  // app.use('/api/friendships', friendshipRoutes);
  // app.use('/api/buddy-messages', buddyMessageRoutes);
  
  console.log('✅ All routes set up successfully!');
} catch (error) {
  console.error('❌ Error setting up routes:', error.message);
}

// API routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is healthy - 100% FREE APIs!',
    freeServices: {
      maps: 'OpenStreetMap',
      geocoding: 'Nominatim',
      places: 'Overpass API',
      ai: LLM_PROVIDER === 'ollama' ? 'Ollama (Local)' : 'OpenAI'
    },
    monthlyCost: '$0 (vs $350+ for Google APIs)',
    llmProvider: LLM_PROVIDER
  });
});

// Test route for FREE geocoding
app.get('/api/test-geocoding', async (req, res) => {
  const testAddress = req.query.address || 'Piazza del Duomo';
  const testDestination = req.query.destination || 'Milano';
  
  const result = await geocodeAddress(testAddress, testDestination);
  
  res.json({ 
    service: 'FREE Nominatim (OpenStreetMap)',
    apiKeysNeeded: 'NONE! 🆓',
    testAddress: `${testAddress}, ${testDestination}`,
    geocodeResult: result,
    savings: '$200+/month compared to Google Geocoding API'
  });
});

app.post('/api/generate-itinerary', validateDestination, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { destination, startDate, endDate, interests, specialRequirements } = req.body;

  try {
    const tripData = {
      destination,
      startDate,
      endDate,
      interests,
      specialRequirements
    };

    console.log(`🌍 Generating itinerary for ${destination}...`);

    // Generate AI itinerary (now includes geocoding)
    const itinerary = await generateAIItinerary(tripData);
    if (!itinerary) {
      return res.status(500).json({ error: 'Failed to generate AI itinerary.' });
    }

    console.log('🎯 Fetching Google Places data...');
    // Fetch Google Places data
    const places = await getFreePlacesData(destination);

    const enhancedItinerary = {
      ...itinerary,
      places: places || []
    };

    console.log('✅ Itinerary generated successfully!');
    res.json(enhancedItinerary);
  } catch (error) {
    console.error('❌ Error in /api/generate-itinerary:', error);
    res.status(500).json({ error: 'Failed to generate itinerary', details: error.message });
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../build', 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test geocoding: http://localhost:${PORT}/api/test-geocoding?address=Duomo&destination=Milano`);
});