# 🧪 Testing Chat-Travel API with Insomnia

## Setup Instructions

### 1. Create New Request
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/chat-travel`

### 2. Headers
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Note**: To get a JWT token, you need to:
1. Register/login through the frontend at `http://localhost:3000`
2. Check browser DevTools → Application → Local Storage → `token`
3. Copy the token value (starts with `eyJ...`)

### 3. Request Body (JSON)

#### Simple Test (Fast - No Geocoding)
```json
{
  "message": "Create a 5-day itinerary for Rome, Italy",
  "conversationHistory": [],
  "userPreferences": {
    "interests": ["culture", "food", "history"]
  },
  "skipGeocoding": true
}
```

#### Full Test (With Real Coordinates)
```json
{
  "message": "Create a 5-day itinerary for Rome, Italy",
  "conversationHistory": [],
  "userPreferences": {
    "interests": ["culture", "food", "history"]
  },
  "skipGeocoding": false
}
```

#### Complex Test
```json
{
  "message": "Plan a 7-day luxury vacation to Tokyo, Japan for 2 people with interests in food, culture, nightlife, and shopping. Budget is around $3000.",
  "conversationHistory": [
    {
      "type": "user",
      "content": "I want to plan a trip to Japan"
    },
    {
      "type": "ai", 
      "content": "I'd be happy to help you plan a trip to Japan! Could you tell me more about your preferences?"
    }
  ],
  "userPreferences": {
    "interests": ["food", "culture", "nightlife", "shopping"],
    "budget": "luxury"
  }
}
```

### 4. Expected Response Format

#### Success Response (200 OK)
```json
{
  "response": "I've created your complete Rome itinerary!",
  "trip": {
    "destination": "Rome, Italy",
    "title": "5-Day Rome Adventure",
    "startDate": "2024-06-01",
    "endDate": "2024-06-05",
    "duration": 5,
    "estimatedCost": 1500,
    "budget": "moderate",
    "dailyItineraries": [
      {
        "day": 1,
        "date": "2024-06-01",
        "theme": "Ancient Rome",
        "totalBudget": 300,
        "activities": [
          {
            "name": "Colosseum Visit",
            "time": "09:00",
            "duration": 120,
            "location": "Piazza del Colosseo, 1, Rome",
            "latitude": 41.8902,
            "longitude": 12.4922,
            "category": "sightseeing",
            "description": "Explore the iconic Roman amphitheater",
            "cost": 50,
            "tips": "Book skip-the-line tickets in advance",
            "bookingRequired": true
          }
        ]
      }
    ]
  },
  "actions": [
    {
      "label": "💾 Save Trip",
      "action": "save_trip",
      "priority": "high"
    }
  ],
  "suggestions": [
    "🍽️ Add more restaurant recommendations",
    "🎨 Include cultural experiences"
  ],
  "metadata": {
    "generatedAt": "2024-01-01T12:00:00Z",
    "hasStructuredData": true,
    "daysGenerated": 5,
    "activitiesGenerated": 20,
    "estimatedCost": 1500
  }
}
```

#### Error Responses

**401 Unauthorized**
```json
{
  "error": "Access denied. No token provided."
}
```

**400 Bad Request**
```json
{
  "error": "Message is required"
}
```

**500 Server Error**
```json
{
  "error": "AI service unavailable. Please check server configuration.",
  "suggestion": "Please try again or rephrase your request."
}
```

## 🔧 Testing Scenarios

### Scenario 1: Basic Trip Request
```json
{
  "message": "Plan a 3-day trip to Paris"
}
```

### Scenario 2: Detailed Trip Request
```json
{
  "message": "Create a 7-day itinerary for Barcelona, Spain for 2 people with a budget of $2000. We love food, museums, and nightlife."
}
```

### Scenario 3: Follow-up Request
```json
{
  "message": "Add more restaurant recommendations to day 3",
  "conversationHistory": [
    {
      "type": "user",
      "content": "Create a 5-day itinerary for Rome"
    },
    {
      "type": "ai",
      "content": "I've created your Rome itinerary!"
    }
  ]
}
```

## 🚨 Common Issues & Solutions

### Issue 1: Request Timeout in Insomnia
**Cause**: API takes 30-60+ seconds to process (OpenAI + geocoding)
**Solution**: 
- **Insomnia**: Go to Preferences → General → Request timeout → Set to `120000` (120 seconds)
- **Quick test**: Add `"skipGeocoding": true` to your request body
- **Check server logs**: The API will still complete, check console for "Total request took: X ms"

### Issue 2: "trip": null in response
**Cause**: OpenAI response was truncated or JSON parsing failed
**Solution**: Check server logs for parsing errors, try shorter trip duration

### Issue 3: No coordinates in activities
**Cause**: Google Maps API key missing, geocoding failed, or `skipGeocoding: true`
**Solution**: 
- Check `GOOGLE_MAPS_API_KEY` in environment variables
- Set `"skipGeocoding": false` in request body
- Check server logs for geocoding errors

### Issue 4: 401 Unauthorized
**Cause**: Missing or invalid JWT token
**Solution**: Get fresh token from frontend login

### Issue 5: 408 Request Timeout
**Cause**: Server-side timeout (after 2 minutes)
**Solution**: Try shorter trip duration or add `"skipGeocoding": true`

## 📊 Debugging Tips

1. **Check Server Logs**: Look for detailed parsing logs
2. **Verify Environment Variables**: Ensure API keys are set
3. **Test Health Endpoint**: `GET http://localhost:5000/api/health`
4. **Start Fresh**: Clear conversation history for new tests

## 🔗 Health Check Endpoint
```
GET http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Server is healthy",
  "googleMapsApiKey": true,
  "openaiApiKey": true
}
``` 