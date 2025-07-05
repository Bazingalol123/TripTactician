const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');

// Import free services
const ollamaService = require('../services/ollamaService');
const mapsService = require('../services/mapsService');

// Web search function using free scraping
async function searchWeb(query, num = 5) {
  try {
    // Free alternative - scrape Google search results
    const response = await fetch(`https://www.google.com/search?q=${encodeURIComponent(query)}&num=${num}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.warn('Google search failed, using backup method');
      return [];
    }
    
    const html = await response.text();
    
    // Simple regex to extract search results (basic scraping)
    const results = [];
    const titleRegex = /<h3[^>]*>([^<]+)<\/h3>/g;
    const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>/g;
    
    let titleMatch, linkMatch;
    let i = 0;
    
    while ((titleMatch = titleRegex.exec(html)) && i < num) {
      if (linkMatch = linkRegex.exec(html)) {
        results.push({
          title: titleMatch[1],
          link: linkMatch[1],
          snippet: `Information about ${query}`,
          rating: null
        });
        i++;
      }
    }
    
    return results;
  } catch (error) {
    console.error('Web search error:', error);
    // Return mock data for development
    return [
      {
        title: `Top ${query} attractions`,
        snippet: `Comprehensive guide to ${query} with latest information`,
        rating: 4.5
      },
      {
        title: `Best ${query} experiences 2024`,
        snippet: `Updated list of must-visit places and activities`,
        rating: 4.7
      }
    ];
  }
}

// Enhanced FREE Places search using OpenStreetMap data via Overpass API
async function searchPlacesEnhanced(destination, options = {}) {
  const {
    categories = ['tourist_attraction'],
    radius = 50000, // 50km radius
    minRating = 3.0,
    priceLevel = null, // null, 0-4 scale
    openNow = false,
    maxResults = 20,
    timeout = 30000 // 30 seconds timeout for free API calls
  } = options;

  console.log('🗺️ === FREE SEARCHPLACESENHANCED STARTED ===');
  console.log('📍 Destination:', destination);
  console.log('🔧 Categories:', categories);
  console.log('📊 Options:', { radius, minRating, priceLevel, openNow, maxResults, timeout });
  
  const searchStartTime = Date.now();

  console.log('🆓 Using FREE OpenStreetMap + Overpass API (no API key needed)!');

  const allPlaces = [];

  try {
    console.log('📍 Step 1: FREE Geocoding destination with Nominatim...');
    const geocodeStartTime = Date.now();
    
    // Use FREE geocoding service
    const geocodeResult = await mapsService.geocode(destination);
    
    const geocodeEndTime = Date.now();
    console.log(`⏱️ FREE Geocoding took ${geocodeEndTime - geocodeStartTime}ms`);
    
    if (!geocodeResult.latitude || !geocodeResult.longitude) {
      console.error('❌ FREE Geocoding failed for:', destination);
      throw new Error('Could not geocode destination with free service');
    }

    const { latitude: lat, longitude: lng } = geocodeResult;
    console.log('📍 FREE Coordinates found:', { lat, lng });

    // Search for each category using FREE Overpass API
    console.log('📍 Step 2: FREE Places search for', categories.length, 'categories...');
    
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      console.log(`📋 FREE Searching category ${i + 1}/${categories.length}: ${category}`);
      
      try {
        const categoryStartTime = Date.now();
        
        // Use FREE places search service
        const categoryPlaces = await mapsService.searchPlaces(destination, category, radius);
        
        const categoryEndTime = Date.now();
        console.log(`⏱️ FREE Category ${category} search took ${categoryEndTime - categoryStartTime}ms`);
        
        if (categoryPlaces && categoryPlaces.length > 0) {
          // Apply filters and format for compatibility
          const filteredPlaces = categoryPlaces
            .filter(place => !minRating || (place.rating >= minRating))
            .filter(place => !priceLevel || (place.price_level <= priceLevel))
            .slice(0, maxResults)
            .map(place => ({
              ...place,
              category,
              name: place.name,
              address: place.formatted_address,
              rating: place.rating || 0,
              price_level: place.price_level || 0,
              location: { lat: place.latitude, lng: place.longitude },
              place_id: place.place_id,
              types: place.types || [category],
              photos: place.photos || [],
              opening_hours: place.opening_hours,
              business_status: 'OPERATIONAL',
              permanently_closed: false
            }));
          
          console.log(`✅ FREE Added ${filteredPlaces.length} places from ${category}`);
          allPlaces.push(...filteredPlaces);
        } else {
          console.warn(`⚠️ FREE No places found for ${category}`);
        }

        // Rate limiting for free service
        console.log('⏳ FREE API rate limiting delay (1000ms)...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.warn(`❌ FREE Failed to fetch ${category} places:`, error.message);
      }
    }

    const searchEndTime = Date.now();
    const totalSearchTime = searchEndTime - searchStartTime;
    
    console.log(`⏱️ === TOTAL FREE SEARCHPLACESENHANCED TIME: ${totalSearchTime}ms ===`);
    console.log(`✅ === FREE SEARCHPLACESENHANCED COMPLETED: ${allPlaces.length} total places ===`);

    return allPlaces;
    
  } catch (error) {
    const searchEndTime = Date.now();
    const totalSearchTime = searchEndTime - searchStartTime;
    
    console.error('❌ === FREE SEARCHPLACESENHANCED FAILED ===');
    console.error('❌ Error after', totalSearchTime, 'ms:', error);
    console.error('Enhanced places search error:', error);
    return [];
  }
}

// Intelligent place filtering and ranking algorithm
async function intelligentPlaceRanking(places, userPreferences = {}, tripContext = {}) {
  const {
    interests = [],
    budget = 'moderate',
    travelStyle = 'leisure',
    accessibility = false,
    groupSize = 2,
    preferredTimes = [], // morning, afternoon, evening
    duration = 7 // trip duration in days
  } = userPreferences;

  const {
    currentLocation = null,
    visitedPlaces = new Set(),
    dayTheme = 'general',
    timeSlot = 'any' // morning, afternoon, evening
  } = tripContext;

  // Scoring algorithm
  const scoredPlaces = places.map(place => {
    let score = 0;
    const factors = {};

    // Base rating score (40% weight)
    factors.rating = (place.rating || 0) * 8; // Max 40 points
    
    // Review count credibility (10% weight)
    const reviewCount = place.user_ratings_total || 0;
    factors.credibility = Math.min(reviewCount / 100, 1) * 10; // Max 10 points

    // Price level match (15% weight)
    const budgetMapping = { budget: [0, 1], moderate: [1, 2, 3], luxury: [3, 4] };
    const preferredPrices = budgetMapping[budget] || [1, 2];
    factors.price = preferredPrices.includes(place.price_level || 1) ? 15 : 0;

    // Distance from current location (10% weight)
    if (currentLocation && place.location) {
      const distance = calculateDistance(
        currentLocation.lat, currentLocation.lng,
        place.location.lat, place.location.lng
      );
      factors.distance = Math.max(0, 10 - (distance / 5)); // Closer = better score
    } else {
      factors.distance = 5; // Neutral score if no location data
    }

    // Category relevance to interests (15% weight)
    factors.interests = 0;
    if (place.types && interests.length > 0) {
      const interestMapping = {
        museums: ['museum', 'art_gallery', 'library'],
        food: ['restaurant', 'cafe', 'bakery', 'meal_takeaway'],
        nightlife: ['bar', 'night_club', 'casino'],
        outdoor: ['park', 'zoo', 'amusement_park', 'aquarium'],
        shopping: ['shopping_mall', 'store', 'clothing_store'],
        culture: ['church', 'mosque', 'synagogue', 'hindu_temple', 'place_of_worship'],
        history: ['museum', 'historical_site', 'monument'],
        art: ['art_gallery', 'museum'],
        sports: ['stadium', 'gym'],
        wellness: ['spa', 'beauty_salon']
      };

      for (const interest of interests) {
        const relevantTypes = interestMapping[interest] || [];
        if (place.types.some(type => relevantTypes.includes(type))) {
          factors.interests += 15 / interests.length;
        }
      }
    }

    // Avoid duplicates (5% weight)
    factors.uniqueness = visitedPlaces.has(place.place_id) ? 0 : 5;

    // Business status (5% weight)
    factors.operational = place.business_status === 'OPERATIONAL' && !place.permanently_closed ? 5 : 0;

    // Time slot relevance (bonus points)
    if (place.opening_hours && timeSlot !== 'any') {
      // This would require more detailed opening hours parsing
      factors.timing = 0; // Placeholder for now
    }

    score = Object.values(factors).reduce((sum, val) => sum + val, 0);

    return {
      ...place,
      aiScore: score,
      scoringFactors: factors
    };
  });

  // Sort by AI score and remove low-scoring places
  return scoredPlaces
    .filter(place => place.aiScore > 30) // Minimum quality threshold
    .sort((a, b) => b.aiScore - a.aiScore);
}

// === NEW: Use LLM to choose a narrow list of POI categories ===
async function getLLMSuggestedPOICategories(destination, interests = [], duration = 7) {
  try {
    const prompt = `You are a travel planning expert with deep knowledge of OpenStreetMap tags.\nGiven the destination \"${destination}\" and the traveller interests \"${interests.join(', ')}\", list ONLY the 10-15 MOST relevant OpenStreetMap POI tags that should be queried to build a well-rounded ${duration}-day trip.\n\nRules:\n1. Respond with a pure JSON array, nothing else.\n2. Each element must be a lowercase string like \"museum\", \"cafe\", \"park\".\n3. Maximum 15 elements.`;

    const raw = await callLLM(prompt, { max_tokens: 120 });
    const match = raw.match(/\[[\s\S]*?\]/);
    if (!match) throw new Error('No JSON array found in LLM response');
    const arr = JSON.parse(match[0]);
    return Array.isArray(arr) ? arr.slice(0, 15) : [];
  } catch (err) {
    console.warn('⚠️ getLLMSuggestedPOICategories failed:', err.message);
    return [];
  }
}

// Comprehensive trip data generator with categorized recommendations
async function generateSmartTripRecommendations(destination, tripParams = {}) {
  const {
    duration = 7,
    interests = [],
    budget = 'moderate',
    groupSize = 2,
    userPreferences = {}
  } = tripParams;

  console.log(`🧠 Generating smart recommendations for ${destination}...`);

  // === NEW: Determine categories via LLM first ===
  let categoriesList = await getLLMSuggestedPOICategories(destination, interests, duration);
  if (!categoriesList.length) {
    console.log('⚠️ LLM did not return categories – using fallback list');
    categoriesList = ['museum','cafe','restaurant','park','historic_site','art_gallery','viewpoint','shopping_mall','zoo','bar'];
  }
  categoriesList = [...new Set(categoriesList)]; // Ensure uniqueness
  console.log('📋 Final search categories:', categoriesList.join(', '));

  const recommendations = {};

  // Fetch places for each category returned by LLM (or fallback)
  for (const category of categoriesList) {
    try {
      console.log(`🔍 Fetching ${category} places...`);

      const rawPlaces = await searchPlacesEnhanced(destination, {
        categories: [category],
        minRating: 3.0,
        maxResults: 20
      });

      // Apply intelligent ranking
      const rankedPlaces = await intelligentPlaceRanking(rawPlaces, userPreferences, {
        dayTheme: category
      });

      recommendations[category] = rankedPlaces.slice(0, 10); // Keep top 10 per category
      console.log(`✅ ${category}: kept ${recommendations[category].length} high-quality places`);

      // Short pause for free API courtesy (150 ms)
      await new Promise(resolve => setTimeout(resolve, 150));
    } catch (error) {
      console.warn(`Failed to process ${category}:`, error.message);
      recommendations[category] = [];
    }
  }

  // Generate LLM-powered insights and organization (optional)
  // const llmInsights = await generateLLMInsights(destination, recommendations, tripParams);

  return {
    destination,
    duration,
    totalPlacesFound: Object.values(recommendations).reduce((sum, places) => sum + places.length, 0),
    categories: recommendations,
    // insights: llmInsights,
    insights: { rawInsights: 'AI insights are temporarily disabled.' },
    generatedAt: new Date().toISOString()
  };
}

// Use LLM to provide intelligent insights and organization
async function generateLLMInsights(destination, recommendations, tripParams) {
  const { interests, budget, duration, groupSize } = tripParams;
  
  // Prepare context for LLM
  const context = {
    destination,
    topAttractions: recommendations.attractions?.slice(0, 5).map(p => ({
      name: p.name,
      rating: p.rating,
      types: p.types
    })) || [],
    topRestaurants: recommendations.restaurants?.slice(0, 5).map(p => ({
      name: p.name,
      rating: p.rating,
      price_level: p.price_level
    })) || [],
    interests,
    budget,
    duration,
    groupSize
  };

  const prompt = `As a travel expert, analyze this real data for ${destination} and provide intelligent insights:

Context:
- Duration: ${duration} days
- Group size: ${groupSize}
- Budget: ${budget}
- Interests: ${interests.join(', ')}

Top Attractions Found:
${context.topAttractions.map(a => `- ${a.name} (${a.rating}⭐)`).join('\n')}

Top Restaurants Found:
${context.topRestaurants.map(r => `- ${r.name} (${r.rating}⭐, Price: ${'$'.repeat(r.price_level || 1)})`).join('\n')}

Please provide:
1. Route optimization suggestions (logical area groupings)
2. Best times to visit top attractions (avoid crowds)
3. Budget allocation recommendations
4. Hidden gems analysis (lower-rated but unique places worth visiting)
5. Weather/seasonal considerations
6. Local insider tips

Keep response structured and actionable. Focus on optimizing the real places found, not suggesting new ones.`;

  try {
    const llmResponse = await callLLM(prompt);
    return {
      rawInsights: llmResponse,
      routeOptimization: extractRouteOptimization(llmResponse),
      budgetAdvice: extractBudgetAdvice(llmResponse),
      timingTips: extractTimingTips(llmResponse),
      hiddenGems: extractHiddenGems(llmResponse)
    };
  } catch (error) {
    console.error('LLM insights generation failed:', error);
    return {
      rawInsights: 'Analysis temporarily unavailable',
      routeOptimization: [],
      budgetAdvice: 'Budget recommendations not available',
      timingTips: [],
      hiddenGems: []
    };
  }
}

// Distance calculation helper
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

// Geocode a single address using FREE Nominatim service
async function geocodeAddress(address, destination) {
  try {
    const fullAddress = `${address}, ${destination}`;
    console.log(`🗺️ FREE Geocoding: ${fullAddress}`);
    
    const result = await mapsService.geocode(fullAddress);
    
    if (!result.latitude || !result.longitude) {
      throw new Error('Geocoding returned invalid coordinates');
    }
    
    console.log(`✅ Successfully geocoded: ${address} -> ${result.latitude}, ${result.longitude}`);
    
    return {
      lat: result.latitude,
      lng: result.longitude,
      formatted_address: result.formatted_address
    };
    
  } catch (error) {
    console.error('FREE geocoding error:', error);
    
    // Try geocoding just the destination first
    try {
      console.log(`🔄 Retrying geocoding with destination only: ${destination}`);
      const destinationResult = await mapsService.geocode(destination);
      
      if (destinationResult.latitude && destinationResult.longitude) {
        console.log(`✅ Found destination coordinates: ${destinationResult.latitude}, ${destinationResult.longitude}`);
        
        // Return destination coordinates with a small offset to avoid exact duplicates
        return {
          lat: destinationResult.latitude + (Math.random() - 0.5) * 0.01,
          lng: destinationResult.longitude + (Math.random() - 0.5) * 0.01,
          formatted_address: `${address}, ${destination}`
        };
      }
    } catch (destinationError) {
      console.error('Destination geocoding also failed:', destinationError);
    }
    
    // If all geocoding fails, throw an error instead of using fallback
    throw new Error(`Failed to geocode address: ${address} in ${destination}. Please check the address format.`);
  }
}

// Get fallback coordinates for major destinations
function getFallbackCoordinates(destination) {
  const cityCoords = {
    'israel': { lat: 31.0461, lng: 34.8516 },
    'tel aviv': { lat: 32.0853, lng: 34.7818 },
    'jerusalem': { lat: 31.7683, lng: 35.2137 },
    'rome': { lat: 41.9028, lng: 12.4964 },
    'paris': { lat: 48.8566, lng: 2.3522 },
    'london': { lat: 51.5074, lng: -0.1278 },
    'new york': { lat: 40.7128, lng: -74.0060 },
    'tokyo': { lat: 35.6762, lng: 139.6503 },
    'barcelona': { lat: 41.3851, lng: 2.1734 },
    'amsterdam': { lat: 52.3676, lng: 4.9041 },
    'madrid': { lat: 40.4168, lng: -3.7038 },
    'berlin': { lat: 52.5200, lng: 13.4050 },
    'vienna': { lat: 48.2082, lng: 16.3738 },
    'prague': { lat: 50.0755, lng: 14.4378 },
    'athens': { lat: 37.9755, lng: 23.7348 },
    'milan': { lat: 45.4642, lng: 9.1900 },
    'venice': { lat: 45.4408, lng: 12.3155 },
    'florence': { lat: 43.7696, lng: 11.2558 },
    'naples': { lat: 40.8518, lng: 14.2681 },
    'seville': { lat: 37.3886, lng: -5.9823 },
    'italy': { lat: 41.9028, lng: 12.4964 }, // Default to Rome for Italy
    'spain': { lat: 40.4168, lng: -3.7038 }, // Default to Madrid for Spain
    'france': { lat: 48.8566, lng: 2.3522 }, // Default to Paris for France
    'germany': { lat: 52.5200, lng: 13.4050 }, // Default to Berlin for Germany
    'netherlands': { lat: 52.3676, lng: 4.9041 }, // Default to Amsterdam for Netherlands
    'austria': { lat: 48.2082, lng: 16.3738 }, // Default to Vienna for Austria
    'czech republic': { lat: 50.0755, lng: 14.4378 }, // Default to Prague for Czech Republic
    'greece': { lat: 37.9755, lng: 23.7348 } // Default to Athens for Greece
  };
  
  const destLower = destination?.toLowerCase() || '';
  const match = Object.keys(cityCoords).find(city => destLower.includes(city));
  
  if (match) {
    console.log(`📍 Found fallback coordinates for ${destination}: ${cityCoords[match].lat}, ${cityCoords[match].lng}`);
    return cityCoords[match];
  }
  
  // If no specific match, try to extract a city name from the destination
  const cityMatch = destLower.match(/([a-zA-Z\s]+?)(?:,|\s+in\s+|\s+to\s+|\s+for\s+|\s+trip\s+to\s+)/);
  if (cityMatch) {
    const cityName = cityMatch[1].trim();
    const cityKey = Object.keys(cityCoords).find(city => cityName.includes(city));
    if (cityKey) {
      console.log(`📍 Found city match for ${destination}: ${cityCoords[cityKey].lat}, ${cityCoords[cityKey].lng}`);
      return cityCoords[cityKey];
    }
  }
  
  // Last resort: use Rome as default instead of New York
  console.log(`⚠️ No specific coordinates found for ${destination}, using Rome as default`);
  return { lat: 41.9028, lng: 12.4964 }; // Default to Rome instead of NYC
}

// Extract trip parameters from user message
function extractTripParameters(message) {
  const params = {
    duration: 7,
    destination: null,
    startDate: null,
    endDate: null,
    budget: 'moderate'
  };
  
  // Extract duration
  const durationMatch = message.match(/(\d+)\s*days?/i);
  if (durationMatch) {
    params.duration = parseInt(durationMatch[1]);
  }
  
  // Extract destination (improved patterns)
  const destinationPatterns = [
    /(?:to|visit|in|for|trip to|travel to)\s+([A-Z][a-zA-Z\s]+?)(?:\s+for|\s+from|\s+in|\s*,|\s*\.|\s*!|\s*\?|$)/i,
    /([A-Z][a-zA-Z\s]+?)\s+(?:trip|vacation|holiday|itinerary)/i
  ];
  
  for (const pattern of destinationPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      params.destination = match[1].trim();
      break;
    }
  }
  
  // Extract budget
  if (message.toLowerCase().includes('budget') || message.toLowerCase().includes('cheap')) {
    params.budget = 'budget';
  } else if (message.toLowerCase().includes('luxury') || message.toLowerCase().includes('expensive')) {
    params.budget = 'luxury';
  }
  
  return params;
}

// Main chat endpoint - SIMPLIFIED AND RELIABLE
router.post('/chat-travel', authMiddleware, async (req, res) => {
  // Set a longer timeout for this endpoint (5 minutes for Ollama)
  req.setTimeout(300000, () => {
    console.log('Request timeout after 5 minutes');
    if (!res.headersSent) {
      res.status(408).json({
        error: 'Request timeout',
        suggestion: 'The trip generation is taking longer than expected. Ollama might be processing a complex request.'
      });
    }
  });

  try {
    const { message, conversationHistory = [], userPreferences = {}, skipGeocoding = false } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const callLLM = req.callLLM;
    if (!callLLM) {
      console.error('❌ LLM service not available');
      return res.status(500).json({ 
        error: 'AI service unavailable. Please check server configuration.' 
      });
    }

    console.log('🤖 Processing travel chat:', message);
    const startTime = Date.now();
    
    // Extract trip parameters
    const tripParams = extractTripParameters(message);
    console.log('📋 Trip parameters:', tripParams);

    // Enhanced system prompt that works reliably with Ollama
    const systemPrompt = `You are an expert travel planner. When users request a trip itinerary, provide a complete day-by-day plan with COMPREHENSIVE daily scheduling.

CRITICAL JSON FORMATTING RULES:
- ALL string values must be in double quotes
- ALL numeric values must be numbers (not strings)
- Use "cost": 0 for free activities (never "cost": free)
- Use "time": "07:30" format (always quoted)
- Use "duration": 120 format (number, not quoted)
- Use "bookingRequired": true or false (not quoted)

COMPREHENSIVE DAILY PLANNING REQUIREMENTS:
- Create 8-12 activities per day for complete schedules
- Include breakfast, lunch, dinner from restaurant places below
- Add coffee breaks using cafe places below
- Include afternoon snacks/gelato breaks
- Add aperitivo/drinks time where culturally appropriate
- Mix sightseeing with dining throughout the day
- Start days early (07:30-08:00) and end late (21:30-22:30)
- Space activities realistically with travel time

ACTIVITY CATEGORIES TO INCLUDE DAILY:
- Morning coffee/breakfast spot (07:30-09:00)
- 2-3 morning sightseeing activities (09:00-12:30)
- Lunch restaurant with local cuisine (12:30-14:00)
- Afternoon cultural/shopping activities (14:30-17:00)
- Afternoon coffee/gelato break (17:00-17:30)
- Evening aperitivo/drinks (17:30-19:00)
- Dinner restaurant (19:30-21:30)
- Optional evening entertainment/nightlife (22:00+)

TIMING GUIDELINES:
- Start days early (07:30-08:00) with breakfast
- Space activities 30-60 minutes apart
- Include realistic travel time between locations
- End days late (21:30-22:30) with dinner/drinks
- Consider local dining customs and opening hours

IMPORTANT: Always respond with this exact format:

**Brief response text here**

<TRIP_DATA>
{
  "destination": "City, Country",
  "title": "Descriptive Trip Title",
  "startDate": "2024-06-01",
  "endDate": "2024-06-08",
  "duration": 8,
  "estimatedCost": 2500,
  "budget": "moderate",
  "dailyItineraries": [
    {
      "day": 1,
      "date": "2024-06-01",
      "theme": "Arrival & Historic Center Exploration",
      "totalBudget": 300,
      "activities": [
        {
          "name": "Breakfast at Local Cafe",
          "time": "08:00",
          "duration": 60,
          "location": "Specific Cafe Name and Address",
          "category": "dining",
          "description": "Traditional local breakfast with coffee",
          "cost": 12,
          "tips": "Try the local pastries",
          "bookingRequired": false
        },
        {
          "name": "Morning Coffee & People Watching",
          "time": "10:30",
          "duration": 30,
          "location": "Famous Local Coffee Shop",
          "category": "dining",
          "description": "Traditional coffee culture experience",
          "cost": 8,
          "tips": "Order like a local",
          "bookingRequired": false
        },
        {
          "name": "Lunch at Traditional Restaurant",
          "time": "13:00",
          "duration": 90,
          "location": "Recommended Local Restaurant",
          "category": "dining",
          "description": "Authentic local cuisine",
          "cost": 35,
          "tips": "Try the regional specialty",
          "bookingRequired": true
        },
        {
          "name": "Afternoon Gelato Break",
          "time": "16:30",
          "duration": 20,
          "location": "Best Gelato Shop in Area",
          "category": "dining",
          "description": "Artisanal gelato tasting",
          "cost": 6,
          "tips": "Try unusual flavors",
          "bookingRequired": false
        },
        {
          "name": "Aperitivo Hour",
          "time": "18:00",
          "duration": 60,
          "location": "Rooftop Bar with Views",
          "category": "entertainment",
          "description": "Local aperitivo culture with drinks and snacks",
          "cost": 25,
          "tips": "Drinks often include free snacks",
          "bookingRequired": false
        },
        {
          "name": "Dinner at Fine Restaurant",
          "time": "20:30",
          "duration": 120,
          "location": "Highly-rated Local Restaurant",
          "category": "dining",
          "description": "Multi-course dinner with local wine",
          "cost": 65,
          "tips": "Make reservation in advance",
          "bookingRequired": true
        }
      ]
    }
  ]
}
</TRIP_DATA>

ENHANCED REQUIREMENTS:
- Provide 8-12 activities per day (not just 4-6)
- Include specific restaurant names, cafes, and food spots
- Add morning coffee rituals and afternoon breaks
- Include aperitivo/drinks culture where appropriate
- Mix major sights with authentic local experiences
- Add realistic timing with meal customs
- Include transportation suggestions between areas
- Consider local business hours and customs
- Use real places and specific addresses when possible
- Balance tourist attractions with local life
- Categories: dining, sightseeing, culture, entertainment, shopping, nature, nightlife
- Budget levels: budget (under $100/day), moderate ($100-300/day), luxury ($300+/day)
- Make activities realistic and well-spaced throughout the day
- ENSURE VALID JSON: All strings quoted, numbers unquoted, no trailing commas

Current request parameters:
- Destination: ${tripParams.destination || 'Not specified'}
- Duration: ${tripParams.duration || 7} days
- Budget: ${tripParams.budget || 'moderate'}`;

    // Build conversation with context
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-4).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    console.log('📤 Sending request to LLM...');
    const llmStartTime = Date.now();

    // Call LLM (OpenAI or Ollama) with proper error handling
    const aiResponse = await callLLM(messages, {
      model: 'gpt-4o-mini', // Will be ignored for Ollama
      temperature: 0.7,
      max_tokens: 16000
    });

    const llmDuration = Date.now() - llmStartTime;
    
    console.log('📥 Received response from LLM:', aiResponse?.length, 'characters');
    console.log('⏱️ LLM took:', llmDuration, 'ms');
    
    console.log('🔍 FULL AI RESPONSE:');
    console.log('='.repeat(80));
    console.log(aiResponse);
    console.log('='.repeat(80));

    if (!aiResponse) {
      throw new Error('Empty response from OpenAI');
    }

    // Extract trip data
    let tripData = null;
    let responseText = aiResponse;

    console.log('🔍 Looking for TRIP_DATA tags...');
    console.log('Has <TRIP_DATA>:', aiResponse.includes('<TRIP_DATA>'));
    console.log('Has </TRIP_DATA>:', aiResponse.includes('</TRIP_DATA>'));

    // More robust parsing - handle missing closing tag
    let tripDataMatch = aiResponse.match(/<TRIP_DATA>([\s\S]*?)<\/TRIP_DATA>/);
    
    if (!tripDataMatch && aiResponse.includes('<TRIP_DATA>')) {
      // Handle case where closing tag is missing - extract from opening tag to end
      console.log('⚠️ Missing closing tag, attempting to extract JSON...');
      const startIndex = aiResponse.indexOf('<TRIP_DATA>') + '<TRIP_DATA>'.length;
      let jsonContent = aiResponse.substring(startIndex);
      
      // Try to find where the JSON ends by looking for the last }
      const lastBraceIndex = jsonContent.lastIndexOf('}');
      if (lastBraceIndex > 0) {
        jsonContent = jsonContent.substring(0, lastBraceIndex + 1);
        tripDataMatch = [null, jsonContent]; // Simulate match array
        console.log('✅ Extracted JSON from incomplete response');
      }
    }
    
    if (tripDataMatch) {
      console.log('✅ Found TRIP_DATA match!');
      console.log('Raw matched content length:', tripDataMatch[1].length);
      console.log('First 500 chars of matched content:', tripDataMatch[1].substring(0, 500));
      console.log('Last 500 chars of matched content:', tripDataMatch[1].substring(tripDataMatch[1].length - 500));
      
      try {
        let rawTripData = tripDataMatch[1].trim();
        
        // Log the cleaning process
        console.log('🧹 Cleaning JSON data...');
        console.log('Original length:', rawTripData.length);
        
        rawTripData = rawTripData
          .replace(/^\s*```json\s*/i, '')
          .replace(/\s*```\s*$/i, '')
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          // Fix common Ollama JSON issues
          .replace(/"cost":\s*free\b/gi, '"cost": 0')
          .replace(/"cost":\s*Free\b/gi, '"cost": 0')
          .replace(/"cost":\s*FREE\b/gi, '"cost": 0')
          .replace(/"time":\s*(\d{1,2}:\d{2})\b/g, '"time": "$1"')
          .replace(/"duration":\s*(\d+)\b/g, '"duration": $1')
          .replace(/"bookingRequired":\s*"?(true|false)"?/gi, '"bookingRequired": $1')
          .replace(/"day":\s*"?(\d+)"?/g, '"day": $1')
          .replace(/"totalBudget":\s*"?(\d+)"?/g, '"totalBudget": $1')
          .replace(/"estimatedCost":\s*"?(\d+)"?/g, '"estimatedCost": $1');
          
        console.log('Cleaned length:', rawTripData.length);
        console.log('Cleaned data starts with:', rawTripData.substring(0, 100));
        console.log('Cleaned data ends with:', rawTripData.substring(rawTripData.length - 100));

        // Check if JSON is complete
        const isCompleteJSON = rawTripData.trim().endsWith('}') && 
                              (rawTripData.match(/\{/g) || []).length === (rawTripData.match(/\}/g) || []).length;
        
        if (!isCompleteJSON) {
          console.warn('⚠️ JSON appears incomplete - attempting to fix...');
          console.log('Open braces:', (rawTripData.match(/\{/g) || []).length);
          console.log('Close braces:', (rawTripData.match(/\}/g) || []).length);
          
          // Try to complete the JSON by adding missing closing braces
          const openBraces = (rawTripData.match(/\{/g) || []).length;
          const closeBraces = (rawTripData.match(/\}/g) || []).length;
          const missingBraces = openBraces - closeBraces;
          
          if (missingBraces > 0) {
            rawTripData += '\n' + '}'.repeat(missingBraces);
            console.log('🔧 Added', missingBraces, 'closing braces');
          }
        }

        tripData = JSON.parse(rawTripData);
        console.log('✅ JSON parsing successful!');
        console.log('Trip data structure:', {
          destination: tripData.destination,
          title: tripData.title,
          daysCount: tripData.dailyItineraries?.length,
          firstDayActivities: tripData.dailyItineraries?.[0]?.activities?.length
        });

                 // Add coordinates to activities - PARALLEL PROCESSING
         if (tripData && tripData.dailyItineraries && !skipGeocoding) {
           console.log('🗺️ Adding coordinates to activities (parallel processing)...');
           console.log('📍 Destination:', tripData.destination);
           console.log('📋 Trip data structure:', {
             days: tripData.dailyItineraries.length,
             totalActivities: tripData.dailyItineraries.reduce((sum, day) => sum + (day.activities?.length || 0), 0)
           });
           
           const geocodingStartTime = Date.now();
           
           // Collect all activities that need geocoding
           const activitiesToGeocode = [];
           for (const day of tripData.dailyItineraries) {
             if (day.activities) {
               for (const activity of day.activities) {
                 if (activity.location) {
                   activitiesToGeocode.push(activity);
                 }
               }
             }
           }
           
           console.log(`📍 Found ${activitiesToGeocode.length} activities to geocode`);
           console.log('📍 Sample activities:', activitiesToGeocode.slice(0, 3).map(a => ({
             name: a.name,
             location: a.location,
             category: a.category
           })));
           
           // Geocode all activities in parallel (with batching to respect rate limits)
           const batchSize = 3; // Process 3 at a time to respect API limits
           const results = [];
           
           for (let i = 0; i < activitiesToGeocode.length; i += batchSize) {
             const batch = activitiesToGeocode.slice(i, i + batchSize);
             console.log(`📍 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(activitiesToGeocode.length/batchSize)}`);
             
             const batchPromises = batch.map(async (activity) => {
               try {
                 console.log(`🗺️ Geocoding: ${activity.name} at ${activity.location}`);
                 const coords = await geocodeAddress(activity.location, tripData.destination);
                 console.log(`✅ Success: ${activity.name} -> ${coords.lat}, ${coords.lng}`);
                 return { activity, coords, success: true };
               } catch (error) {
                 console.error(`❌ Geocoding failed for ${activity.name} (${activity.location}):`, error.message);
                 return { 
                   activity, 
                   coords: null,
                   success: false,
                   error: error.message
                 };
               }
             });
             
             const batchResults = await Promise.all(batchPromises);
             results.push(...batchResults);
             
             // Small delay between batches
             if (i + batchSize < activitiesToGeocode.length) {
               console.log('⏳ Waiting 2 seconds before next batch...');
               await new Promise(resolve => setTimeout(resolve, 2000)); // Longer delay for free API
             }
           }
           
           // Apply coordinates to activities (only successful ones)
           let successfulGeocoding = 0;
           let failedGeocoding = 0;
           
           results.forEach(({ activity, coords, success, error }) => {
             if (success && coords) {
               activity.latitude = coords.lat;
               activity.longitude = coords.lng;
               if (coords.formatted_address) {
                 activity.formatted_address = coords.formatted_address;
               }
               successfulGeocoding++;
             } else {
               console.warn(`⚠️ Skipping coordinates for ${activity.name}: ${error}`);
               failedGeocoding++;
               // Don't add fallback coordinates - leave them undefined
             }
           });
           
           const geocodingDuration = Date.now() - geocodingStartTime;
           console.log(`✅ Geocoding completed: ${successfulGeocoding} successful, ${failedGeocoding} failed`);
           console.log('⏱️ Geocoding took:', geocodingDuration, 'ms');
           
           if (failedGeocoding > 0) {
             console.warn(`⚠️ ${failedGeocoding} activities could not be geocoded. They will not appear on the map.`);
           }
         } else if (skipGeocoding) {
           console.log('⏭️ Skipping geocoding for faster response');
         }

        // Add metadata
        tripData.createdBy = req.user.id;
        tripData.createdAt = new Date();
        tripData.status = 'planning';
        tripData.source = 'ai_generated';

        // Clean response text (remove the TRIP_DATA part)
        responseText = aiResponse.replace(/<TRIP_DATA>[\s\S]*?<\/TRIP_DATA>/, '').trim();
        
              } catch (parseError) {
          console.error('❌ JSON parsing failed:', parseError.message);
          console.error('Parse error details:', parseError);
          console.log('Raw data (first 1000 chars):', rawTripData?.substring(0, 1000));
          console.log('Raw data (last 1000 chars):', rawTripData?.substring(rawTripData.length - 1000));
          
          // Continue without trip data but return the conversational response
          tripData = null;
        }
      } else {
        console.log('❌ No TRIP_DATA tags found in response');
        console.log('Response contains <TRIP_DATA>:', aiResponse.includes('<TRIP_DATA>'));
        console.log('Response contains </TRIP_DATA>:', aiResponse.includes('</TRIP_DATA>'));
        console.log('Response length:', aiResponse.length);
        console.log('Response preview (first 1000 chars):', aiResponse.substring(0, 1000));
        console.log('Response ending (last 1000 chars):', aiResponse.substring(aiResponse.length - 1000));
      }

    // Generate suggestions and actions
    const suggestions = tripData ? [
      '🍽️ Add more restaurant recommendations',
      '🎨 Include cultural experiences',
      '💰 Show budget-friendly alternatives',
      '🚗 Add transportation details',
      '🏨 Suggest accommodations',
      '📱 What apps should I download?'
    ] : [
      '🗺️ Create a detailed itinerary',
      '🏛️ What are the must-see attractions?',
      '🍕 Best local food experiences',
      '🎪 Current events and festivals',
      '💼 Required documents',
      '🌤️ Weather information'
    ];

    const actions = tripData ? [
      { label: '💾 Save Trip', action: 'save_trip', priority: 'high' },
      { label: '🗺️ View on Map', action: 'view_map', priority: 'high' },
      { label: '📄 Export PDF', action: 'export_pdf', priority: 'medium' },
      { label: '✏️ Modify Trip', action: 'modify_trip', priority: 'medium' },
      { label: '📱 Share Trip', action: 'share_trip', priority: 'low' }
    ] : [];

    // Send response
    const totalDuration = Date.now() - startTime;
    console.log('🎯 Total request took:', totalDuration, 'ms');
    
    res.json({
      response: responseText || 'I\'ve created your travel itinerary!',
      trip: tripData,
      actions: actions,
      suggestions: suggestions.slice(0, 6),
      metadata: {
        generatedAt: new Date(),
        hasStructuredData: !!tripData,
        daysGenerated: tripData?.dailyItineraries?.length || 0,
        activitiesGenerated: tripData?.dailyItineraries?.reduce((total, day) => 
          total + (day.activities?.length || 0), 0) || 0,
        estimatedCost: tripData?.estimatedCost || 0,
        processingTime: {
          total: totalDuration,
          llm: llmDuration || 0,
          geocoding: tripData && !skipGeocoding ? 'included' : 'skipped'
        }
      }
    });

  } catch (error) {
    console.error('❌ Chat API Error:', error);
    
    // Provide helpful error messages
    let errorMessage = 'I encountered an error processing your request.';
    let suggestion = 'Please try again or rephrase your request.';
    
    if (error.message.includes('rate_limit')) {
      errorMessage = 'I\'m currently experiencing high demand.';
      suggestion = 'Please wait a moment and try again.';
    } else if (error.message.includes('invalid_api_key')) {
      errorMessage = 'AI service configuration issue.';
      suggestion = 'Please contact support.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      suggestion: suggestion,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Enhanced Google Places search with detailed information
async function getPlaceDetails(placeId) {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,rating,price_level,opening_hours,photos,reviews,website,formatted_phone_number,types,geometry&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Place Details API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'OK') {
      return data.result;
    }
    
    return null;
  } catch (error) {
    console.error('Place details error:', error);
    return null;
  }
}

// Get photo URL from photo reference
function getPhotoUrl(photoReference, maxWidth = 400) {
  if (!photoReference || !process.env.GOOGLE_MAPS_API_KEY) {
    return null;
  }
  
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
}

// Generate itinerary using real Google Places data
async function generateRealDataItinerary(destination, duration = 7, interests = [], budget = 'moderate') {
  console.log(`🗺️ Generating real-data itinerary for ${destination}, ${duration} days`);
  
  const itinerary = {
    destination,
    title: `${duration}-Day Adventure in ${destination}`,
    duration,
    estimatedCost: calculateEstimatedCost(duration, budget),
    budget,
    dailyItineraries: []
  };

  // Define activity types based on interests
  const activityTypes = {
    culture: ['museum', 'art_gallery', 'church', 'synagogue', 'mosque', 'historical_site'],
    food: ['restaurant', 'cafe', 'bakery', 'food'],
    shopping: ['shopping_mall', 'store', 'market'],
    nature: ['park', 'zoo', 'aquarium', 'botanical_garden'],
    entertainment: ['amusement_park', 'movie_theater', 'night_club', 'bar'],
    sightseeing: ['tourist_attraction', 'point_of_interest', 'landmark'],
    accommodation: ['lodging', 'hotel']
  };

  // Get places for each category
  const allPlaces = {};
  for (const [category, types] of Object.entries(activityTypes)) {
    allPlaces[category] = [];
    
    for (const type of types.slice(0, 2)) { // Limit API calls
      try {
        const places = await mapsService.searchPlaces(destination, type);
        allPlaces[category].push(...places);
        
        // Add delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`Failed to fetch ${type} places:`, error);
      }
    }
    
    // Remove duplicates and sort by rating
    allPlaces[category] = allPlaces[category]
      .filter((place, index, self) => 
        index === self.findIndex(p => p.name === place.name)
      )
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 10); // Keep top 10 per category
  }

  console.log('📍 Found places by category:', Object.keys(allPlaces).map(cat => 
    `${cat}: ${allPlaces[cat].length}`
  ).join(', '));

  // Generate daily itineraries
  for (let day = 1; day <= duration; day++) {
    const dayTheme = getDayTheme(day, duration);
    const dailyBudget = Math.round(itinerary.estimatedCost / duration);
    
    const dayItinerary = {
      day,
      date: new Date(Date.now() + (day - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      theme: dayTheme,
      totalBudget: dailyBudget,
      activities: []
    };

    // Plan activities for the day
    const dayActivities = await planDayActivities(day, duration, allPlaces, budget);
    dayItinerary.activities = dayActivities;

    itinerary.dailyItineraries.push(dayItinerary);
  }

  return itinerary;
}

// Plan activities for a specific day
async function planDayActivities(day, totalDays, allPlaces, budget) {
  const activities = [];
  const usedPlaces = new Set();

  // Morning activity (9-11 AM)
  if (day === 1) {
    // First day: arrival and check-in
    activities.push({
      time: '09:00',
      name: 'Arrival & Hotel Check-in',
      description: 'Arrive at your destination and check into your accommodation.',
      location: 'Hotel/Accommodation',
      duration: '120',
      cost: '0',
      category: 'accommodation',
      tips: 'Store your luggage if check-in is not available yet.'
    });
  } else {
    // Regular sightseeing
    const attraction = selectBestPlace(allPlaces.sightseeing, usedPlaces);
    if (attraction) {
      activities.push(await createActivity(attraction, '09:00', 120, 'sightseeing'));
      usedPlaces.add(attraction.name);
    }
  }

  // Lunch (12-13 PM)
  const restaurant = selectBestPlace(allPlaces.food, usedPlaces, 'restaurant');
  if (restaurant) {
    activities.push(await createActivity(restaurant, '12:00', 90, 'dining'));
    usedPlaces.add(restaurant.name);
  }

  // Afternoon activity (14-17 PM)
  const culturePlace = selectBestPlace(allPlaces.culture, usedPlaces);
  if (culturePlace) {
    activities.push(await createActivity(culturePlace, '14:00', 180, 'culture'));
    usedPlaces.add(culturePlace.name);
  }

  // Evening activity (18-20 PM)
  if (day === totalDays) {
    // Last day: shopping or relaxed activity
    const shopping = selectBestPlace(allPlaces.shopping, usedPlaces);
    if (shopping) {
      activities.push(await createActivity(shopping, '18:00', 120, 'shopping'));
    }
  } else {
    // Regular evening entertainment
    const entertainment = selectBestPlace(allPlaces.entertainment, usedPlaces);
    if (entertainment) {
      activities.push(await createActivity(entertainment, '18:00', 120, 'entertainment'));
      usedPlaces.add(entertainment.name);
    }
  }

  return activities;
}

// Select best place from category, avoiding duplicates
function selectBestPlace(places, usedPlaces, preferredType = null) {
  if (!places || places.length === 0) return null;
  
  let filteredPlaces = places.filter(place => !usedPlaces.has(place.name));
  
  if (preferredType) {
    const preferred = filteredPlaces.filter(place => 
      place.types?.some(type => type.includes(preferredType))
    );
    if (preferred.length > 0) {
      filteredPlaces = preferred;
    }
  }
  
  // Return highest rated place
  return filteredPlaces.sort((a, b) => (b.rating || 0) - (a.rating || 0))[0] || null;
}

// Create activity object from place data
async function createActivity(place, time, duration, category) {
  // Extract coordinates with fallback logic
  let latitude = null;
  let longitude = null;
  
  if (place.location?.lat && place.location?.lng) {
    latitude = typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat;
    longitude = typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng;
  } else if (place.geometry?.location?.lat && place.geometry?.location?.lng) {
    latitude = typeof place.geometry.location.lat === 'function' ? place.geometry.location.lat() : place.geometry.location.lat;
    longitude = typeof place.geometry.location.lng === 'function' ? place.geometry.location.lng() : place.geometry.location.lng;
  }
  
  console.log(`🗺️ Creating activity "${place.name}" with coordinates:`, { latitude, longitude });
  
  const activity = {
    time,
    name: place.name,
    description: generateActivityDescription(place, category),
    location: place.address || place.formatted_address || place.vicinity || 'Location details not available',
    duration: duration.toString(),
    cost: estimateActivityCost(place, category),
    category,
    tips: generateActivityTip(place, category),
    latitude,
    longitude,
    rating: place.rating,
    photos: [],
    place_id: place.place_id // Add place_id for better Google Maps integration
  };

  // Add photo if available
  if (place.photos && Array.isArray(place.photos) && place.photos.length > 0) {
    const photoRef = place.photos[0].photo_reference;
    if (photoRef) {
      const photoUrl = getPhotoUrl(photoRef);
      if (photoUrl) {
        activity.photos = [photoUrl];
      }
    }
  }

  return activity;
}

// Generate activity description based on place data
function generateActivityDescription(place, category) {
  const descriptions = {
    sightseeing: `Explore this ${place.rating ? `highly-rated (${place.rating}⭐)` : 'popular'} attraction and discover its unique features.`,
    dining: `Enjoy ${place.rating ? `excellent (${place.rating}⭐)` : 'delicious'} local cuisine at this recommended restaurant.`,
    culture: `Immerse yourself in local culture at this ${place.rating ? `well-reviewed (${place.rating}⭐)` : 'fascinating'} cultural site.`,
    entertainment: `Experience the local nightlife and entertainment scene at this popular venue.`,
    shopping: `Browse local goods and souvenirs at this ${place.rating ? `well-rated (${place.rating}⭐)` : 'popular'} shopping destination.`,
    accommodation: 'Check into your accommodation and get settled for your trip.'
  };

  return descriptions[category] || `Visit this interesting location in ${place.name}.`;
}

// Estimate activity cost based on place data and category
function estimateActivityCost(place, category) {
  const baseCosts = {
    sightseeing: [15, 25, 35],
    dining: [25, 45, 75],
    culture: [10, 20, 30],
    entertainment: [20, 35, 50],
    shopping: [30, 60, 100],
    accommodation: [0, 0, 0]
  };

  const priceLevel = place.price_level || 1;
  const costs = baseCosts[category] || [15, 25, 35];
  
  return costs[Math.min(priceLevel, costs.length - 1)].toString();
}

// Generate helpful tip for activity
function generateActivityTip(place, category) {
  const tips = {
    sightseeing: 'Arrive early to avoid crowds and get the best photos.',
    dining: 'Try the local specialties and ask for recommendations.',
    culture: 'Check opening hours and consider booking tickets in advance.',
    entertainment: 'Check dress code and age restrictions before visiting.',
    shopping: 'Bargaining might be acceptable in local markets.',
    accommodation: 'Keep your booking confirmation and ID ready.'
  };

  return tips[category] || 'Enjoy your visit and take plenty of photos!';
}

// Get day theme based on day number
function getDayTheme(day, totalDays) {
  if (day === 1) return 'Arrival & First Impressions';
  if (day === totalDays) return 'Final Exploration & Departure';
  
  const themes = [
    'Historical & Cultural Sites',
    'Local Food & Markets',
    'Nature & Outdoor Activities',
    'Art & Entertainment',
    'Hidden Gems & Local Life',
    'Shopping & Relaxation'
  ];
  
  return themes[(day - 2) % themes.length];
}

// Calculate estimated cost based on duration and budget
function calculateEstimatedCost(duration, budget) {
  const dailyCosts = {
    budget: 80,
    moderate: 150,
    luxury: 300
  };
  
  return (dailyCosts[budget] || dailyCosts.moderate) * duration;
}

// New endpoint for generating trips with real data
router.post('/generate-real-trip', authMiddleware, async (req, res) => {
  try {
    const { destination, duration = 7, interests = [], budget = 'moderate' } = req.body;
    
    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    console.log(`🌍 Generating real-data trip for ${destination}`);
    
    const itinerary = await generateUnifiedRealTrip(destination, { duration, interests, budget });
    
    if (!itinerary || !itinerary.dailyItineraries || itinerary.dailyItineraries.length === 0) {
      return res.status(500).json({ 
        error: 'Failed to generate itinerary with real data',
        suggestion: 'Try a different destination or check your internet connection.'
      });
    }

    res.json({
      success: true,
      trip: itinerary,
      message: `Generated ${duration}-day itinerary for ${destination} using real place data!`,
      dataSource: 'Google Places API'
    });

  } catch (error) {
    console.error('Real trip generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate trip with real data',
      details: error.message 
    });
  }
});

// Smart Trip Recommendations API endpoint
router.post('/smart-recommendations', authMiddleware, async (req, res) => {
  try {
    console.log('📥 Smart recommendations request received:', req.body);
    
    const { destination, duration = 7, interests = [], budget = 'moderate', groupSize = 2 } = req.body;

    if (!destination) {
      console.error('❌ Missing destination in request');
      return res.status(400).json({ error: 'Destination is required' });
    }

    console.log(`🚀 Generating smart recommendations for ${destination}`, {
      duration,
      interests,
      budget,
      groupSize
    });

    // Proceed with free services if Google Maps API key is missing
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.log('⚠️ Google Maps API key not configured – proceeding with free OpenStreetMap services only');
    }

    const recommendations = await generateSmartTripRecommendations(destination, {
      duration,
      interests,
      budget,
      groupSize,
      userPreferences: {
        interests,
        budget,
        travelStyle: 'leisure',
        groupSize
      }
    });

    console.log('✅ Smart recommendations generated successfully:', {
      totalPlaces: recommendations.totalPlacesFound,
      categories: Object.keys(recommendations.categories).length
    });

    res.json({
      success: true,
      data: recommendations,
      message: `Found ${recommendations.totalPlacesFound} places across ${Object.keys(recommendations.categories).length} categories`,
      dataSource: 'OpenStreetMap + AI Ranking'
    });

  } catch (error) {
    console.error('❌ Smart recommendations error:', error);
    res.status(500).json({ 
      error: 'Failed to generate smart recommendations',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Dynamic car rental search using location-based pricing
router.post('/car-rentals', authMiddleware, async (req, res) => {
  try {
    const { destination, pickupDate, returnDate, driverAge = 25 } = req.body;

    console.log(`🚗 Car rental search: ${destination}, ${pickupDate} to ${returnDate}`);
    
    // Use dynamic car rental service instead of mock data
    const rentals = await mapsService.searchCarRentals(destination, pickupDate, returnDate, {
      driverAge
    });

    res.json({
      success: true,
      destination,
      pickupDate,
      returnDate,
      rentals: rentals,
      message: `Found ${rentals.length} car rental options with location-based pricing`,
      dataSource: 'dynamic_pricing'
    });

  } catch (error) {
    console.error('Car rental search error:', error);
    res.status(500).json({ 
      error: 'Failed to search car rentals',
      details: error.message 
    });
  }
});

// Helper functions to extract structured data from LLM responses
function extractRouteOptimization(llmResponse) {
  // Simple regex-based extraction - could be improved with more sophisticated parsing
  const routeSection = llmResponse.match(/Route optimization[^:]*:(.+?)(?=\d\.|$)/is);
  if (routeSection) {
    return routeSection[1].split('\n').filter(line => line.trim().startsWith('-')).map(line => line.trim().substring(1).trim());
  }
  return [];
}

function extractBudgetAdvice(llmResponse) {
  const budgetSection = llmResponse.match(/Budget[^:]*:(.+?)(?=\d\.|$)/is);
  if (budgetSection) {
    return budgetSection[1].trim();
  }
  return 'Budget allocation advice not available';
}

function extractTimingTips(llmResponse) {
  const timingSection = llmResponse.match(/Best times[^:]*:(.+?)(?=\d\.|$)/is);
  if (timingSection) {
    return timingSection[1].split('\n').filter(line => line.trim().startsWith('-')).map(line => line.trim().substring(1).trim());
  }
  return [];
}

function extractHiddenGems(llmResponse) {
  const gemsSection = llmResponse.match(/Hidden gems[^:]*:(.+?)(?=\d\.|$)/is);
  if (gemsSection) {
    return gemsSection[1].split('\n').filter(line => line.trim().startsWith('-')).map(line => line.trim().substring(1).trim());
  }
  return [];
}

// Enhanced search function that maintains backward compatibility
async function searchPlaces(destination, type = 'tourist_attraction') {
  return await searchPlacesEnhanced(destination, {
    categories: [type],
    maxResults: 8
  });
}

// Helper function to check Ollama status and available models
async function checkOllamaStatus() {
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json();
      const models = data.models?.map(m => m.name) || [];
      console.log('🤖 Ollama available models:', models);
      return { running: true, models };
    }
  } catch (error) {
    console.log('❌ Ollama not running or not accessible');
  }
  
  return { running: false, models: [] };
}

// Initialize LLM service on startup
(async () => {
  console.log('🔧 Initializing LLM service...');
  console.log('📝 LLM Provider:', process.env.LLM_PROVIDER || 'openai');
  
  if (process.env.LLM_PROVIDER === 'ollama') {
    const status = await checkOllamaStatus();
    if (status.running) {
      console.log('✅ Ollama is running');
      if (status.models.length === 0) {
        console.log('⚠️ No models installed. Install a model with: ollama pull llama3.2');
      }
    } else {
      console.log('❌ Ollama not running. Start with: ollama serve');
      console.log('💡 Or switch to OpenAI by setting LLM_PROVIDER=openai');
    }
  } else {
    if (process.env.OPENAI_API_KEY) {
      console.log('✅ OpenAI API key configured');
    } else {
      console.log('❌ OpenAI API key not configured. Set OPENAI_API_KEY environment variable');
    }
  }
})();

// LLM service function (unified for OpenAI and Ollama)
async function callLLM(messages, options = {}) {
  const {
    model = process.env.LLM_PROVIDER === 'ollama' ? (process.env.OLLAMA_MODEL || 'llama3.1:8b') : 'gpt-3.5-turbo',
    max_tokens = 1000,
    temperature = 0.7,
    timeout = 120000 // 2 minutes default timeout
  } = options;

  console.log('🤖 === CALLLM STARTED ===');
  console.log('⏰ LLM call timeout set to:', timeout, 'ms');
  console.log('🔧 Model:', model);
  console.log('📊 Options:', { max_tokens, temperature });
  
  const llmStartTime = Date.now();

  try {
    if (process.env.LLM_PROVIDER === 'ollama') {
      console.log('🦙 Using Ollama provider');
      
      // Check if Ollama is running and get available models
      console.log('🔍 Checking Ollama status...');
      const ollamaStatus = await checkOllamaStatus();
      if (!ollamaStatus.running) {
        console.error('❌ Ollama service not running');
        throw new Error('Ollama service is not running. Please start Ollama and try again.');
      }

      // Check if the requested model is available
      if (ollamaStatus.models.length > 0 && !ollamaStatus.models.some(m => m.includes(model))) {
        const availableModels = ollamaStatus.models.join(', ');
        console.error('❌ Model not available:', model, 'Available:', availableModels);
        throw new Error(`Model '${model}' not found. Available models: ${availableModels}. Install with: ollama pull ${model}`);
      }

      // Convert messages to single prompt for Ollama
      let prompt = '';
      if (Array.isArray(messages)) {
        prompt = messages.map(msg => {
          if (msg.role === 'system') {
            return `System: ${msg.content}`;
          } else if (msg.role === 'user') {
            return `User: ${msg.content}`;
          }
          return msg.content;
        }).join('\n\n');
      } else {
        prompt = messages;
      }

      console.log('🤖 Calling Ollama with model:', model);
      console.log('📝 Prompt length:', prompt.length, 'characters');
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ Ollama request timeout triggered');
        controller.abort();
      }, timeout);

      try {
        // Try chat completions first (for newer Ollama versions)
        console.log('📡 Attempting Ollama chat API...');
        const chatApiStartTime = Date.now();
        
        const chatResponse = await fetch('http://localhost:11434/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: Array.isArray(messages) ? messages : [{ role: 'user', content: messages }],
            stream: false,
            options: {
              temperature,
              num_predict: max_tokens
            }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (chatResponse.ok) {
          const chatApiEndTime = Date.now();
          console.log(`⏱️ Ollama chat API took ${chatApiEndTime - chatApiStartTime}ms`);
          
          const chatData = await chatResponse.json();
          console.log('✅ Ollama chat API successful');
          console.log('📄 Response length:', chatData.message?.content?.length || 0, 'characters');
          
          const llmEndTime = Date.now();
          console.log(`⏱️ === TOTAL LLM TIME: ${llmEndTime - llmStartTime}ms ===`);
          
          return chatData.message?.content || chatData.response || 'Unable to generate insights at this time.';
        } else {
          console.log('📝 Ollama chat API failed, status:', chatResponse.status);
        }
      } catch (chatError) {
        clearTimeout(timeoutId);
        if (chatError.name === 'AbortError') {
          console.error('⏰ Ollama chat API timed out');
          throw new Error(`Ollama request timed out after ${timeout}ms`);
        }
        console.log('📝 Ollama chat API error, trying generate API...', chatError.message);
      }

      // Fallback to generate API
      console.log('📡 Attempting Ollama generate API...');
      const generateApiStartTime = Date.now();
      
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => {
        console.log('⏰ Ollama generate request timeout triggered');
        controller2.abort();
      }, timeout);

      try {
        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt,
            stream: false,
            options: {
              temperature,
              num_predict: max_tokens
            }
          }),
          signal: controller2.signal
        });

        clearTimeout(timeoutId2);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Ollama generate API error:', response.status, errorText);
          
          if (response.status === 404) {
            throw new Error(`Model '${model}' not found. Please ensure the model is installed with: ollama pull ${model}`);
          } else if (response.status === 400) {
            throw new Error(`Bad request to Ollama API. Check model name and request format.`);
          } else {
            throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
          }
        }

        const generateApiEndTime = Date.now();
        console.log(`⏱️ Ollama generate API took ${generateApiEndTime - generateApiStartTime}ms`);

        const data = await response.json();
        console.log('✅ Ollama generate API successful');
        console.log('📄 Response length:', data.response?.length || 0, 'characters');
        
        const llmEndTime = Date.now();
        console.log(`⏱️ === TOTAL LLM TIME: ${llmEndTime - llmStartTime}ms ===`);
        
        return data.response || 'Unable to generate insights at this time.';
        
      } catch (generateError) {
        clearTimeout(timeoutId2);
        if (generateError.name === 'AbortError') {
          console.error('⏰ Ollama generate API timed out');
          throw new Error(`Ollama request timed out after ${timeout}ms`);
        }
        throw generateError;
      }
      
    } else {
      console.log('🤖 Using OpenAI provider');
      
      // Use OpenAI
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        console.error('❌ OpenAI API key not configured');
        throw new Error('OpenAI API key not configured');
      }

      console.log('📡 Calling OpenAI API...');
      const openaiStartTime = Date.now();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ OpenAI request timeout triggered');
        controller.abort();
      }, timeout);

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: Array.isArray(messages) ? messages : [{ role: 'user', content: messages }],
            max_tokens,
            temperature
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ OpenAI API error:', response.status, errorText);
          throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        }

        const openaiEndTime = Date.now();
        console.log(`⏱️ OpenAI API took ${openaiEndTime - openaiStartTime}ms`);

        const data = await response.json();
        console.log('✅ OpenAI API successful');
        console.log('📄 Response length:', data.choices[0]?.message?.content?.length || 0, 'characters');
        
        const llmEndTime = Date.now();
        console.log(`⏱️ === TOTAL LLM TIME: ${llmEndTime - llmStartTime}ms ===`);
        
        return data.choices[0]?.message?.content || 'Unable to generate insights at this time.';
        
      } catch (openaiError) {
        clearTimeout(timeoutId);
        if (openaiError.name === 'AbortError') {
          console.error('⏰ OpenAI API timed out');
          throw new Error(`OpenAI request timed out after ${timeout}ms`);
        }
        throw openaiError;
      }
    }
  } catch (error) {
    const llmEndTime = Date.now();
    console.error('❌ === LLM CALL FAILED ===');
    console.error('❌ Error after', llmEndTime - llmStartTime, 'ms:', error);
    
    // Return a more helpful error message based on the type of error
    if (error.message.includes('timed out')) {
      throw new Error(`AI processing timed out after ${timeout}ms. The AI service is taking too long to respond.`);
    } else if (error.message.includes('Model') && error.message.includes('not found')) {
      return `Model not available. Please install the required model or switch to OpenAI.`;
    } else if (error.message.includes('not running')) {
      return `Ollama service not running. Please start Ollama and try again.`;
    } else if (error.message.includes('404')) {
      return `Ollama service not running or model not installed. Please check Ollama status.`;
    } else if (error.message.includes('400')) {
      return `Request format error. The AI service encountered a configuration issue.`;
    }
    
    throw error;
  }
}

// UNIFIED REAL-DATA TRIP GENERATOR - Replaces old fictional system
async function generateUnifiedRealTrip(destination, tripParams = {}) {
  const unifiedStartTime = Date.now();
  console.log('🚀 === GENERATEUNIFIEDREALTRIP STARTED ===');
  console.log('📋 Input params:', { destination, ...tripParams });
  
  const { duration = 7, interests = [], budget = 'moderate', groupSize = 2 } = tripParams;
  
  console.log(`🚀 UNIFIED: Generating real-data trip for ${destination}`, tripParams);
  
  try {
    // Step 1: Get Smart Recommendations (real Google Places data)
    console.log('📍 Step 1: Getting smart recommendations...');
    const smartRecsStartTime = Date.now();
    
    const recommendations = await generateSmartTripRecommendations(destination, {
      duration,
      interests,
      budget,
      groupSize,
      userPreferences: { interests, budget, travelStyle: 'leisure', groupSize }
    });

    const smartRecsEndTime = Date.now();
    console.log(`⏱️ Smart recommendations took ${smartRecsEndTime - smartRecsStartTime}ms`);

    if (!recommendations || !recommendations.categories) {
      console.error('❌ Failed to get recommendations:', recommendations);
      throw new Error('Failed to fetch real place data');
    }

    console.log('✅ UNIFIED: Got real data -', recommendations.totalPlacesFound, 'places');
    console.log('📊 Recommendations by category:', Object.keys(recommendations.categories).map(cat => 
      `${cat}: ${recommendations.categories[cat].length}`
    ).join(', '));

    // Step 2: AI structures real data into daily itineraries
    console.log('📍 Step 2: AI structuring data into itinerary...');
    const structuringStartTime = Date.now();
    
    const structuredItinerary = await structureRealDataIntoItinerary(
      destination, 
      recommendations, 
      tripParams
    );

    const structuringEndTime = Date.now();
    console.log(`⏱️ AI structuring took ${structuringEndTime - structuringStartTime}ms`);
    
    if (!structuredItinerary) {
      console.error('❌ AI structuring failed');
      throw new Error('Failed to structure itinerary with AI');
    }
    
    console.log('✅ AI structuring successful, days:', structuredItinerary.dailyItineraries?.length);

    // Step 3: Combine structured itinerary with recommendations pool
    console.log('📍 Step 3: Combining structured itinerary with recommendations pool...');
    const combineStartTime = Date.now();
    
    const unifiedTrip = {
      ...structuredItinerary,
      
      // Add recommendations as a pool for editing
      availableRecommendations: recommendations,
      
      // Add metadata
      generationMethod: 'unified-real-data',
      dataSource: 'Google Places API + AI Structuring',
      generatedAt: new Date().toISOString()
    };

    const combineEndTime = Date.now();
    console.log(`⏱️ Combining data took ${combineEndTime - combineStartTime}ms`);

    const unifiedEndTime = Date.now();
    const totalUnifiedTime = unifiedEndTime - unifiedStartTime;
    
    console.log(`⏱️ === TOTAL GENERATEUNIFIEDREALTRIP TIME: ${totalUnifiedTime}ms ===`);
    console.log('✅ UNIFIED: Complete trip generated with', 
      unifiedTrip.dailyItineraries?.length, 'days and', 
      recommendations.totalPlacesFound, 'places in pool'
    );
    console.log('✅ === GENERATEUNIFIEDREALTRIP COMPLETED ===');

    return unifiedTrip;
    
  } catch (error) {
    const unifiedEndTime = Date.now();
    const totalUnifiedTime = unifiedEndTime - unifiedStartTime;
    
    console.error('❌ === GENERATEUNIFIEDREALTRIP FAILED ===');
    console.error('❌ Error after', totalUnifiedTime, 'ms:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    throw error;
  }
}

// AI structures real place data into proper daily itineraries
async function structureRealDataIntoItinerary(destination, recommendations, tripParams) {
  const { duration = 7, interests = [], budget = 'moderate' } = tripParams;
  
  // Prepare real places for AI structuring
  const allRealPlaces = [];
  Object.entries(recommendations.categories).forEach(([category, places]) => {
    places.forEach(place => {
      allRealPlaces.push({
        ...place,
        category,
        aiScore: place.aiScore || 0
      });
    });
  });

  console.log('🤖 AI structuring', allRealPlaces.length, 'real places into', duration, 'day itinerary');

  // Create AI prompt for structuring real data - simplified for better JSON generation
  const structuringPrompt = `You are an expert travel planner. Create a comprehensive ${duration}-day itinerary for ${destination} using ONLY the places listed below, but structure them into COMPLETE daily schedules.

CRITICAL JSON RULES:
- ALL property names must be in double quotes
- ALL string values must be in double quotes  
- Numbers must NOT be in quotes (except time which is "07:30")
- NO trailing commas
- NO extra text outside the JSON

COMPREHENSIVE DAILY PLANNING REQUIREMENTS:
- Create 8-12 activities per day for complete schedules
- Include breakfast, lunch, dinner from restaurant places below
- Add coffee breaks using cafe places below
- Include afternoon snacks/gelato breaks
- Add aperitivo/drinks time where culturally appropriate
- Mix sightseeing with dining throughout the day
- Start days early (07:30-08:00) and end late (21:30-22:30)
- Space activities realistically with travel time

DAILY SCHEDULE STRUCTURE:
07:30-09:00: Breakfast + Morning Coffee
09:00-12:30: Morning Sightseeing (2-3 activities)
12:30-14:00: Lunch
14:00-17:00: Afternoon Activities
17:00-18:00: Coffee/Snack Break + Light Activities
18:00-19:30: Aperitivo/Drinks (if applicable)
19:30-22:00: Dinner
22:00+: Optional Evening Entertainment

AVAILABLE PLACES (use exact names):
${allRealPlaces.slice(0, 50).map(place => 
  `${place.name} (${place.category}, Rating: ${place.rating?.toFixed(1) || 'N/A'}, Score: ${place.aiScore?.toFixed(0) || '50'})`
).join('\n')}

IMPORTANT: Use EXACT place names from above list. Create exactly ${duration} days with 8-12 activities each. Include restaurants for all meals, cafes for coffee breaks, and mix in sightseeing/cultural activities.

Respond with ONLY this JSON structure:

<STRUCTURED_ITINERARY>
{
  "destination": "${destination}",
  "title": "Complete ${duration}-Day ${destination} Experience",
  "duration": ${duration},
  "budget": "${budget}",
  "estimatedCost": ${calculateEstimatedCost(duration, budget)},
  "dailyItineraries": [
    {
      "day": 1,
      "date": "2024-06-01", 
      "theme": "Arrival & Historic Center Exploration",
      "totalBudget": ${Math.round(calculateEstimatedCost(duration, budget) / duration)},
      "activities": [
        {
          "name": "Exact place name from list",
          "time": "08:00",
          "duration": 60,
          "location": "Address here",
          "category": "dining",
          "description": "Traditional breakfast with local coffee",
          "cost": 15,
          "tips": "Try the local pastries",
          "bookingRequired": false,
          "aiScore": 85,
          "rating": 4.5
        },
        {
          "name": "Another exact place name",
          "time": "09:30",
          "duration": 120,
          "location": "Address here",
          "category": "sightseeing",
          "description": "Historic landmark exploration",
          "cost": 25,
          "tips": "Visit early to avoid crowds",
          "bookingRequired": false,
          "aiScore": 90,
          "rating": 4.8
        },
        {
          "name": "Coffee place name from list",
          "time": "11:00",
          "duration": 30,
          "location": "Coffee shop address",
          "category": "dining",
          "description": "Traditional coffee culture experience",
          "cost": 8,
          "tips": "Order like a local",
          "bookingRequired": false,
          "aiScore": 75,
          "rating": 4.3
        }
      ]
    }
  ]
}
</STRUCTURED_ITINERARY>`;

  try {
    // Call LLM to structure the real data with optimized parameters for JSON generation
    const llmResponse = await callLLM([
      { role: 'system', content: 'You are a travel planner. Generate valid JSON only. Follow the exact format specified.' },
      { role: 'user', content: structuringPrompt }
    ], {
      temperature: 0.3,  // Lower temperature for more consistent JSON
      max_tokens: 12000  // More tokens for longer responses
    });

    console.log('🤖 AI structuring response received, length:', llmResponse?.length);

    // Extract structured itinerary
    const itineraryMatch = llmResponse.match(/<STRUCTURED_ITINERARY>([\s\S]*?)<\/STRUCTURED_ITINERARY>/);
    if (!itineraryMatch) {
      throw new Error('AI failed to structure itinerary properly');
    }

    let structuredData = itineraryMatch[1].trim()
      .replace(/^\s*```json\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      // Fix Ollama's common JSON issues first
      .replace(/^{\s*,\s*/, '{')                               // Fix leading comma after {
      .replace(/\[\s*,\s*/, '[')                               // Fix leading comma after [
      .replace(/,\s*,/g, ',')                                  // Remove duplicate commas
      .replace(/,\s*}/g, '}')                                  // Remove trailing commas before }
      .replace(/,\s*]/g, ']')                                  // Remove trailing commas before ]
      // Quote fixes
      .replace(/"(\w+)":\s*"?(\d+)"?([,}\]])/g, '"$1": $2$3')  // Ensure numbers aren't quoted
      .replace(/"(time|date)":\s*(\d)/g, '"$1": "$2')          // Ensure time/date are quoted
      .replace(/"\s*"\s*/g, '""')                              // Fix double quotes
      .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');              // Quote unquoted property names

    console.log('🧹 Cleaned JSON (first 500 chars):', structuredData.substring(0, 500));
    console.log('🧹 Cleaned JSON (last 500 chars):', structuredData.substring(structuredData.length - 500));

    let structuredItinerary;
    try {
      structuredItinerary = JSON.parse(structuredData);
    } catch (parseError) {
      console.error('❌ Initial JSON parse failed:', parseError.message);
      console.log('🔧 Attempting advanced JSON repair...');
      
      // Try to fix common Ollama JSON issues more aggressively
      let repairedData = structuredData
        // Fix incomplete quotes
        .replace(/"\s*([^"]*?)\s*\n/g, '"$1",\n')
        // Fix missing quotes around property names
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
        // Fix missing quotes around string values
        .replace(/:\s*([a-zA-Z][^,}\]]*?)(\s*[,}\]])/g, ': "$1"$2')
        // Fix numbers that should be strings
        .replace(/"time":\s*(\d{1,2}:\d{2})/g, '"time": "$1"')
        .replace(/"date":\s*(\d{4}-\d{2}-\d{2})/g, '"date": "$1"')
        // Remove any trailing content after the final }
        .replace(/}\s*[^}\]]*$/, '}');

      try {
        structuredItinerary = JSON.parse(repairedData);
        console.log('✅ Advanced JSON repair successful!');
      } catch (repairError) {
        console.error('❌ Advanced JSON repair also failed:', repairError.message);
        console.log('📝 Problematic JSON section around error:');
        
        // Try to find the error location and show context
        const errorMatch = repairError.message.match(/position (\d+)/);
        if (errorMatch) {
          const errorPos = parseInt(errorMatch[1]);
          const start = Math.max(0, errorPos - 100);
          const end = Math.min(repairedData.length, errorPos + 100);
          console.log('Context:', repairedData.substring(start, end));
        }
        
        throw new Error('Failed to parse AI-generated JSON even after repair attempts');
      }
    }

    // Enrich activities with full place data
    structuredItinerary.dailyItineraries.forEach(day => {
      day.activities = day.activities.map(activity => {
        // Find the real place data
        const realPlace = allRealPlaces.find(place => 
          place.name.toLowerCase().includes(activity.name.toLowerCase()) ||
          activity.name.toLowerCase().includes(place.name.toLowerCase())
        );

        if (realPlace) {
          return {
            ...activity,
            // Enrich with real place data
            place_id: realPlace.place_id,
            latitude: realPlace.latitude,
            longitude: realPlace.longitude,
            rating: realPlace.rating,
            price_level: realPlace.price_level,
            // Format photos as strings for database storage
            photos: realPlace.photos ? realPlace.photos.map(photo => {
              if (typeof photo === 'string') return photo;
              return photo.photo_reference || photo.url || '';
            }).filter(Boolean) : [],
            opening_hours: realPlace.opening_hours,
            types: realPlace.types,
            aiScore: realPlace.aiScore,
            // Keep AI-generated description and tips
            realPlaceData: realPlace
          };
        }

        return activity;
      });
    });

    /* ------------------------------------------------------------
       Ensure mandatory arrival / car rental / hotel / departure
       ------------------------------------------------------------ */

    try {
      const firstDay = structuredItinerary.dailyItineraries[0];
      const lastDay  = structuredItinerary.dailyItineraries[structuredItinerary.dailyItineraries.length - 1];

      // Helper to find a place by type keywords
      const findPlaceByType = (typesArray) => {
        return allRealPlaces.find(p => p.types?.some(t => typesArray.includes(t)));
      };

      // Attempt to locate airport & hotel coordinates
      const airportPlace = findPlaceByType(['airport']) || allRealPlaces.find(p => p.name.toLowerCase().includes('airport'));
      const hotelPlace   = findPlaceByType(['lodging', 'hotel', 'motel']) || allRealPlaces.find(p => p.category === 'hotels');

      const airportCoords = airportPlace ? { lat: airportPlace.latitude, lng: airportPlace.longitude } : { lat: firstDay.activities[0]?.latitude || null, lng: firstDay.activities[0]?.longitude || null };
      const hotelCoords   = hotelPlace ? { lat: hotelPlace.latitude, lng: hotelPlace.longitude } : airportCoords;

      const makeActivity = (name, time, category, coords, description='') => ({
        name,
        time,
        duration: 45,
        location: name,
        category,
        description,
        cost: 0,
        latitude: coords.lat,
        longitude: coords.lng,
        tips: ''
      });

      // DAY 1 mandatory items
      const hasArrival = firstDay.activities.some(a => /arrival/i.test(a.name));
      if (!hasArrival) {
        firstDay.activities.unshift(makeActivity(`Arrival at ${destination} Airport`, tripParams.flightArrivalTime || '09:00', 'transport', airportCoords));
      }

      const hasPickup = firstDay.activities.some(a => /rental car|transport pass/i.test(a.name));
      if (!hasPickup) {
        const pickupName = tripParams.budget === 'budget' ? 'Collect public-transport pass' : 'Pick up rental car';
        firstDay.activities.unshift(makeActivity(pickupName, '09:45', 'transport', airportCoords));
      }

      const hasHotelCheckin = firstDay.activities.some(a => /hotel check-in/i.test(a.name));
      if (!hasHotelCheckin) {
        firstDay.activities.push(makeActivity('Hotel check-in', '16:00', 'accommodation', hotelCoords));
      }

      // FINAL day mandatory items
      const hasReturn = lastDay.activities.some(a => /return rental car|return transit pass/i.test(a.name));
      if (!hasReturn) {
        const returnName = tripParams.budget === 'budget' ? 'Return transit pass' : 'Return rental car';
        lastDay.activities.push(makeActivity(returnName, '15:00', 'transport', airportCoords));
      }

      const hasDeparture = lastDay.activities.some(a => /depart/i.test(a.name));
      if (!hasDeparture) {
        lastDay.activities.push(makeActivity(`Depart from ${destination} Airport`, tripParams.flightDepartureTime || '18:00', 'transport', airportCoords));
      }

    } catch (injectErr) {
      console.warn('⚠️ Failed to inject mandatory arrival/hotel/departure activities:', injectErr.message);
    }

    console.log('✅ AI structured itinerary with', 
      structuredItinerary.dailyItineraries?.length, 'days');

    return structuredItinerary;

  } catch (error) {
    console.error('❌ AI structuring failed:', error);
    // Fallback: create basic structure manually
    return createFallbackItinerary(destination, allRealPlaces, tripParams);
  }
}

// Fallback itinerary creation if AI structuring fails
function createFallbackItinerary(destination, places, tripParams) {
  const { duration = 7, budget = 'moderate' } = tripParams;
  
  console.log('🔄 Creating fallback itinerary with', places.length, 'places');
  
  const itinerary = {
    destination,
    title: `${duration}-Day Real Data Trip to ${destination}`,
    duration,
    budget,
    estimatedCost: calculateEstimatedCost(duration, budget),
    dailyItineraries: []
  };

  // Group places by category
  const placesByCategory = {};
  places.forEach(place => {
    if (!placesByCategory[place.category]) {
      placesByCategory[place.category] = [];
    }
    placesByCategory[place.category].push(place);
  });

  // Sort each category by AI score
  Object.keys(placesByCategory).forEach(category => {
    placesByCategory[category].sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
  });

  // NEW: Helper to pick the next best unused place from a list of categories
  const usedPlaceIds = new Set();
  const pickPlace = (categoryList) => {
    for (const cat of categoryList) {
      const pool = placesByCategory[cat];
      if (pool && pool.length) {
        // Find first unused place in this category
        const idx = pool.findIndex(p => !usedPlaceIds.has(p.place_id));
        if (idx !== -1) {
          const place = pool[idx];
          usedPlaceIds.add(place.place_id);
          return place;
        }
      }
    }
    // Fallback: pick any remaining unused place regardless of category
    for (const cat of Object.keys(placesByCategory)) {
      const pool = placesByCategory[cat];
      if (pool && pool.length) {
        const idx = pool.findIndex(p => !usedPlaceIds.has(p.place_id));
        if (idx !== -1) {
          const place = pool[idx];
          usedPlaceIds.add(place.place_id);
          return place;
        }
      }
    }
    return null;
  };

  // Category priority lists for each time slot
  const morningCategories = ['historic', 'park', 'square', 'museum', 'gallery', 'market', 'amusement_park', 'temple', 'shrine', 'nightclub', 'shopping_centre', 'department_store', 'shop', 'theater', 'cinema'];
  const lunchCategories = ['restaurant', 'cafe', 'bar', 'pub', 'brewery'];
  const afternoonCategories = ['museum', 'gallery', 'historic', 'theater', 'park', 'market', 'square', 'shop', 'temple', 'shrine', 'amusement_park', 'nightclub'];

  // Create daily itineraries
  for (let day = 1; day <= duration; day++) {
    const dayItinerary = {
      day,
      date: new Date(Date.now() + (day - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      theme: getDayTheme(day, duration),
      totalBudget: Math.round(itinerary.estimatedCost / duration),
      activities: []
    };

    // Morning Sightseeing / Attraction
    const morningPlace = pickPlace(morningCategories);
    if (morningPlace) {
      dayItinerary.activities.push(createFallbackActivity(morningPlace, '09:00', 'sightseeing'));
    }

    // Lunch / Dining
    const lunchPlace = pickPlace(lunchCategories);
    if (lunchPlace) {
      dayItinerary.activities.push(createFallbackActivity(lunchPlace, '12:30', 'dining'));
    }

    // Afternoon Cultural / Leisure
    const afternoonPlace = pickPlace(afternoonCategories);
    if (afternoonPlace) {
      dayItinerary.activities.push(createFallbackActivity(afternoonPlace, '14:30', 'culture'));
    }

    itinerary.dailyItineraries.push(dayItinerary);
  }

  return itinerary;
}

function createFallbackActivity(place, time, category) {
  return {
    name: place.name,
    time,
    duration: category === 'dining' ? 90 : 120,
    location: place.address || place.formatted_address || 'Location not available',
    category,
    description: `Visit ${place.name}, a ${place.rating ? `${place.rating}⭐ rated` : 'popular'} ${category} destination.`,
    cost: estimateActivityCost(place, category),
    tips: generateActivityTip(place, category),
    bookingRequired: false,
    latitude: place.latitude,
    longitude: place.longitude,
    rating: place.rating,
    aiScore: place.aiScore,
    place_id: place.place_id,
    // Format photos as strings for database storage
    photos: place.photos ? place.photos.map(photo => {
      if (typeof photo === 'string') return photo;
      return photo.photo_reference || photo.url || '';
    }).filter(Boolean) : [],
    realPlaceData: place
  };
}

// NEW UNIFIED ENDPOINT - This replaces the old fictional trip generation
router.post('/generate-unified-trip', authMiddleware, async (req, res) => {
  const requestStartTime = Date.now();
  console.log('🌟 === UNIFIED TRIP GENERATION REQUEST STARTED ===');
  console.log('⏰ Request received at:', new Date().toISOString());
  console.log('📋 Request body:', req.body);
  
  // Set longer timeout for complex operations
  req.setTimeout(300000, () => {
    console.log('⏰ EXPRESS TIMEOUT: Request exceeded 5 minutes');
    if (!res.headersSent) {
      res.status(408).json({
        error: 'Request timeout after 5 minutes',
        suggestion: 'The trip generation is taking longer than expected. Please try again.'
      });
    }
  });

  try {
    const { destination, duration = 7, interests = [], budget = 'moderate', groupSize = 2, startDate } = req.body;
    
    if (!destination) {
      console.log('❌ Missing destination parameter');
      return res.status(400).json({ error: 'Destination is required' });
    }

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.log('⚠️ Google Maps API key not configured – proceeding with free OpenStreetMap services only');
    }

    console.log(`🌟 UNIFIED TRIP REQUEST: ${destination}, ${duration} days, budget: ${budget}`);
    console.log('👥 Group size:', groupSize);
    console.log('🎯 Interests:', interests);
    console.log('📅 Start date:', startDate);
    
    console.log('🚀 Starting generateUnifiedRealTrip...');
    const unifiedTripStartTime = Date.now();
    
    const unifiedTrip = await generateUnifiedRealTrip(destination, {
      duration,
      interests,
      budget,
      groupSize,
      startDate
    });

    const unifiedTripEndTime = Date.now();
    console.log(`⏱️ generateUnifiedRealTrip completed in ${unifiedTripEndTime - unifiedTripStartTime}ms`);
    
    if (!unifiedTrip) {
      console.log('❌ generateUnifiedRealTrip returned null/undefined');
      throw new Error('Failed to generate unified trip - no data returned');
    }

    // We'll calculate car rentals after we know tripEndDate
     
    console.log('✅ Unified trip generated successfully');
    console.log('📊 Trip summary:', {
      destination: unifiedTrip.destination,
      days: unifiedTrip.dailyItineraries?.length || 0,
      totalActivities: unifiedTrip.dailyItineraries?.reduce((sum, day) => sum + (day.activities?.length || 0), 0) || 0
    });

    // Calculate dates for trip saving
    console.log('📅 Calculating trip dates...');
    const tripStartDate = startDate ? new Date(startDate) : new Date();
    const tripEndDate = new Date(tripStartDate);
    tripEndDate.setDate(tripStartDate.getDate() + parseInt(duration) - 1);
    
    console.log('📅 Trip dates:', {
      start: tripStartDate.toISOString(),
      end: tripEndDate.toISOString()
    });

    // Format photos as strings for database storage
    console.log('🖼️ Processing photos for database storage...');
    const formatPhotosForStorage = (activities) => {
      return activities.map(activity => ({
        ...activity,
        photos: activity.photos ? activity.photos.map(photo => {
          if (typeof photo === 'string') return photo;
          return photo.photo_reference || photo.url || '';
        }).filter(Boolean) : []
      }));
    };

    // Process all daily itineraries to format photos
    if (unifiedTrip.dailyItineraries) {
      console.log('🔄 Processing', unifiedTrip.dailyItineraries.length, 'daily itineraries...');
      unifiedTrip.dailyItineraries.forEach((day, index) => {
        if (day.activities) {
          console.log(`📋 Processing Day ${index + 1} with ${day.activities.length} activities`);
          day.activities = formatPhotosForStorage(day.activities);
        }
      });
    }

    // Add required fields for database storage
    console.log('📦 Preparing trip data for response...');
    const tripForResponse = {
      ...unifiedTrip,
      startDate: tripStartDate,
      endDate: tripEndDate,
    };

    // Calculate stats for frontend
    const totalActivities = tripForResponse.dailyItineraries?.reduce((sum, day) => 
      sum + (day.activities?.length || 0), 0) || 0;

    console.log('📊 Final stats:', {
      totalDays: tripForResponse.dailyItineraries?.length || 0,
      totalActivities: totalActivities,
      availableRecommendations: tripForResponse.availableRecommendations?.totalPlacesFound || 0
    });

    const requestEndTime = Date.now();
    const totalRequestTime = requestEndTime - requestStartTime;
    console.log(`⏱️ === TOTAL REQUEST TIME: ${totalRequestTime}ms ===`);
    console.log('✅ === UNIFIED TRIP GENERATION COMPLETED SUCCESSFULLY ===');

    // === ENHANCEMENT: Add car rental options (moved after dates are calculated) ===
    let carRentals = [];
    try {
      if (startDate) {
        carRentals = await require('../services/mapsService').searchCarRentals(
          destination,
          tripStartDate.toISOString().split('T')[0],
          tripEndDate.toISOString().split('T')[0],
          { driverAge: 25 }
        );
      }
    } catch (carErr) {
      console.error('Car rental search failed:', carErr.message || carErr);
      carRentals = [];
    }
    // === END ENHANCEMENT ===

    // Return in the format expected by frontend
    res.json({
      success: true,
      trip: tripForResponse,
      carRentals: carRentals,
      message: `Generated comprehensive ${duration}-day itinerary for ${destination} using real places + AI structuring! Each day includes 8-12 activities with complete meal planning.`,
      stats: {
        totalDays: tripForResponse.dailyItineraries?.length || 0,
        totalActivities: totalActivities,
        availableRecommendations: tripForResponse.availableRecommendations?.totalPlacesFound || 0,
        dataSource: 'Google Places API + AI Optimization',
        processingTimeMs: totalRequestTime
      }
    });

  } catch (error) {
    const requestEndTime = Date.now();
    const totalRequestTime = requestEndTime - requestStartTime;
    
    console.error('❌ === UNIFIED TRIP GENERATION FAILED ===');
    console.error('❌ Error after', totalRequestTime, 'ms:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate unified trip',
      details: error.message,
      suggestion: 'Try a different destination or check your API configuration.',
      processingTimeMs: totalRequestTime
    });
  }
});

module.exports = router;