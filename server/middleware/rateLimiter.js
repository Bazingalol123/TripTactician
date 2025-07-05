// Simple in-memory rate limiter to prevent excessive requests
const requestCounts = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  for (const [key, data] of requestCounts.entries()) {
    if (data.firstRequest < fiveMinutesAgo) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000);

const createRateLimiter = (maxRequests = 30, windowMs = 60000) => {
  return (req, res, next) => {
    const identifier = `${req.ip}-${req.user?.id || 'anonymous'}-${req.path}`;
    const now = Date.now();
    
    const requestData = requestCounts.get(identifier);
    
    if (!requestData) {
      // First request
      requestCounts.set(identifier, {
        count: 1,
        firstRequest: now,
        lastRequest: now
      });
      return next();
    }
    
    // Reset window if enough time has passed
    if (now - requestData.firstRequest > windowMs) {
      requestCounts.set(identifier, {
        count: 1,
        firstRequest: now,
        lastRequest: now
      });
      return next();
    }
    
    // Check if limit exceeded
    if (requestData.count >= maxRequests) {
      console.log(`Rate limit exceeded for ${identifier}: ${requestData.count} requests`);
      
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Please wait before making more requests',
        retryAfter: Math.ceil((windowMs - (now - requestData.firstRequest)) / 1000)
      });
    }
    
    // Increment counter
    requestData.count++;
    requestData.lastRequest = now;
    requestCounts.set(identifier, requestData);
    
    next();
  };
};

module.exports = {
  tripRateLimit: createRateLimiter(20, 60000), // 20 requests per minute
  generalRateLimit: createRateLimiter(100, 60000) // 100 requests per minute
}; 