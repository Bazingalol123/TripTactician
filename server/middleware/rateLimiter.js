import rateLimit from 'express-rate-limit';

export const generalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

export const tripRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

export const llmRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: parseInt(process.env.LLM_RATE_LIMIT_MAX) || 5,
  keyGenerator: (req) => req.user?.id ?? req.ip,
  message: { error: 'Too many AI requests. Try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});
