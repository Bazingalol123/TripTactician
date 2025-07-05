# 🧪 Timeout Fix Testing Guide

## ⚡ **Quick Performance Test**

### **Test 1: Fast Response (5-10 seconds)**
Use this for quick testing without geocoding:

```json
{
  "message": "Create a 3-day itinerary for Paris",
  "skipGeocoding": true
}
```

**Expected**: Response in 5-15 seconds with trip data but no coordinates

### **Test 2: Full Response (20-40 seconds)**
Use this for complete testing with real coordinates:

```json
{
  "message": "Create a 5-day itinerary for Rome, Italy with moderate budget",
  "conversationHistory": [],
  "userPreferences": {
    "interests": ["culture", "food", "history"]
  },
  "skipGeocoding": false
}
```

**Expected**: Response in 20-60 seconds with trip data AND coordinates

## 🔧 **Insomnia Settings Fix**

1. **Open Insomnia**
2. **Go to**: Application Menu → Preferences (or Ctrl+,)
3. **General Tab**: Find "Request timeout"
4. **Set to**: `120000` (120 seconds)
5. **Save**: Close preferences

## 📊 **Performance Monitoring**

Watch the server console logs for timing information:

```
🤖 Processing travel chat: Create a 5-day itinerary for Rome
📤 Sending request to OpenAI...
⏱️ OpenAI took: 15234 ms
🗺️ Adding coordinates to activities (parallel processing)...
📍 Geocoding 25 activities...
✅ Coordinates added to all 25 activities
⏱️ Geocoding took: 3456 ms
🎯 Total request took: 19857 ms
```

## 🚀 **What Was Fixed**

### **Before** (Slow & Timeouts):
- ❌ Sequential geocoding: 20-30+ seconds
- ❌ No timeout handling
- ❌ No performance monitoring
- ❌ Default 30s Insomnia timeout

### **After** (Fast & Reliable):
- ✅ Parallel geocoding: 3-5 seconds
- ✅ 120s server timeout with proper error handling
- ✅ `skipGeocoding` option for 5-10s responses
- ✅ Performance timing logs
- ✅ Insomnia timeout configuration

## 📈 **Expected Performance**

| Request Type | OpenAI Time | Geocoding Time | Total Time |
|-------------|-------------|----------------|------------|
| Skip Geocoding | 5-15s | 0s | **5-15s** |
| Full Request | 5-15s | 2-8s | **7-25s** |
| Complex Trip (7+ days) | 10-25s | 3-10s | **15-35s** |

## ✅ **Success Indicators**

1. **Insomnia doesn't timeout** (completes request)
2. **Server logs show timing** information
3. **Response includes** `processingTime` metadata
4. **Trip data is complete** with activities
5. **Coordinates present** (when `skipGeocoding: false`)

## 🔍 **Troubleshooting**

### Still Getting Timeouts?
1. **Check Insomnia timeout setting**: Should be 120000ms
2. **Try skip geocoding first**: Add `"skipGeocoding": true`
3. **Check server logs**: Look for error messages
4. **Verify API keys**: Check OpenAI and Google Maps keys

### Slow Performance?
1. **Use skip geocoding**: For development/testing
2. **Try shorter trips**: 3-5 days instead of 7+
3. **Check network**: Slow internet affects OpenAI API calls
4. **Monitor logs**: Look for where delays occur

### No Trip Data?
1. **Check OpenAI key**: Must be valid and have credits
2. **Check model**: Using `gpt-4o-mini` (faster than gpt-4)
3. **Check logs**: Look for JSON parsing errors
4. **Try simpler requests**: "Plan a 3-day trip to Paris" 