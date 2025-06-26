const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai');
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

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.openai.com", "https://maps.googleapis.com"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs for API routes
  message: 'Too many API requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use('/api/', apiLimiter);

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

// Initialize OpenAI with error handling
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} catch (error) {
  console.error('OpenAI initialization error:', error.message);
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

// Google Places API
const getGooglePlacesData = async (destination, type = 'tourist_attraction') => {
  try {
    const cacheKey = `google_places_${destination}_${type}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`${type} in ${destination}`)}&key=${process.env.GOOGLE_PLACES_API_KEY}&type=${type}&maxResults=20`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    const mappedData = data.results.map(place => ({
      name: place.name,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      types: place.types,
      vicinity: place.vicinity,
      place_id: place.place_id,
      photos: place.photos?.slice(0, 3) || [],
      price_level: place.price_level,
      opening_hours: place.opening_hours,
      geometry: place.geometry,
      formatted_address: place.formatted_address,
      business_status: place.business_status
    }));

    setCachedData(cacheKey, mappedData);
    return mappedData;
  } catch (error) {
    console.error('Google Places API Error:', error.message);
    return [];
  }
};

// Get coordinates for locations
const getCoordinates = async (location) => {
  try {
    const cacheKey = `geocode_${location}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${process.env.GOOGLE_PLACES_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      setCachedData(cacheKey, { latitude: lat, longitude: lng });
      return { latitude: lat, longitude: lng };
    } else {
      console.warn(`No geocoding results for: ${location}`);
      return null;
    }
  } catch (error) {
    console.error('Geocoding API Error:', error.message);
    return null;
  }
};

// AI Itinerary Generation
const generateAIItinerary = async (tripData) => {
  try {
    if (!openai) {
      throw new Error('OpenAI client not initialized.');
    }

    const { destination, startDate, endDate, interests, specialRequirements } = tripData;

    const prompt = `Generate a detailed and engaging travel itinerary for a trip to ${destination} from ${startDate} to ${endDate}. The user is interested in ${interests.join(', ')}. ${specialRequirements ? `They also have the following special requirements: ${specialRequirements}.` : ''} Please provide the output as a JSON object with the following structure:\n{\n  "destination": "[Destination Name]",\n  "tripSummary": {\n    "duration": "[Number] days",\n    "bestTimeToVisit": "[Best time of year]",\n    "budgetEstimate": "[Budget range]"\n  },\n  "dailyItineraries": [\n    {\n      "day": [Day number],\n      "date": "[Date]",\n      "theme": "[Theme for the day]",\n      "activities": [\n        {\n          "time": "[Time]",\n          "name": "[Activity Name]",\n          "description": "[Description]",\n          "location": "[Location]",\n          "duration": "[Duration]",\n          "cost": "[Cost]",\n          "tips": "[Tips]",\n          "category": "[Category, e.g., attraction, restaurant, outdoor, cultural]"\n        }\n      ],\n      "transportation": "[Transportation for the day]",\n      "meals": "[Meals for the day]",\n      "accommodation": "[Accommodation for the day]"\n    }\n  ],\n  "practicalInfo": {\n    "bestTimeToVisit": "[Best time to visit]",\n    "transportation": "[Transportation options]",\n    "accommodation": "[Accommodation tips]",\n    "budget": "[Budgeting advice]",\n    "safety": "[Safety tips]",\n    "packing": "[Packing advice]"\n  },\n  "recommendations": {\n    "mustSee": ["[Must-see place]"],\n    "hiddenGems": ["[Hidden gem]"],\n    "food": ["[Local food recommendation]"],\n    "shopping": ["[Shopping recommendation]"],\n    "nightlife": ["[Nightlife recommendation]"],\n    "events": ["[Upcoming event or festival]"]\n  }\n}\nEnsure all fields are populated with relevant information. The content should be rich and detailed, including specific names of places, restaurants, or activities where appropriate. Each day should have at least 3-4 activities. Keep the descriptions concise and engaging. The overall tone should be enthusiastic and informative.`;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful travel assistant that generates detailed trip itineraries in JSON format.' },
        { role: 'user', content: prompt }
      ],
      model: 'gpt-3.5-turbo-1106',
      response_format: { type: 'json_object' }
    });

    const itineraryContent = completion.choices[0].message.content;
    let itinerary = JSON.parse(itineraryContent);

    // Geocode activity locations
    for (const day of itinerary.dailyItineraries) {
      if (day.activities) {
        for (const activity of day.activities) {
          if (activity.location) {
            const coords = await getCoordinates(activity.location + ', ' + itinerary.destination);
            if (coords) {
              activity.latitude = coords.latitude;
              activity.longitude = coords.longitude;
            }
          }
        }
      }
    }

    return itinerary;

  } catch (error) {
    console.error('Error generating AI itinerary:', error.message);
    if (error.response) {
      console.error('OpenAI API Error Details:', error.response.status, error.response.data);
    }
    return null;
  }
};

// Auth routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// API routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' });
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

    // Generate AI itinerary
    const itinerary = await generateAIItinerary(tripData);
    if (!itinerary) {
      return res.status(500).json({ error: 'Failed to generate AI itinerary.' });
    }

    // Fetch Google Places data
    const places = await getGooglePlacesData(destination);

    const enhancedItinerary = {
      ...itinerary,
      places: places || []
    };

    res.json(enhancedItinerary);
  } catch (error) {
    console.error('Error in /api/generate-itinerary:', error);
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
  res.status(500).send('Something broke!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 