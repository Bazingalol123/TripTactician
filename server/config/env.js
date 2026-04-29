import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  MONGODB_URI: z.string(),
  JWT_SECRET: z.string().min(32),
  LLM_PROVIDER: z.enum(['openai', 'ollama', 'azure', 'bedrock']).default('openai'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  OLLAMA_BASE_URL: z.string().optional(),
  OLLAMA_MODEL: z.string().optional(),
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  VIATOR_API_KEY: z.string().optional(),
  VIATOR_AFFILIATE_ID: z.string().optional(),
  BOOKING_AFFILIATE_ID: z.string().optional(),
  GYG_AFFILIATE_ID: z.string().optional(),
  EMAIL_PROVIDER: z.enum(['resend', 'nodemailer']).default('resend'),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default('noreply@triptactician.com'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  LLM_RATE_LIMIT_MAX: z.string().default('5'),
  LOG_LEVEL: z.string().default('info'),
  FOURSQUARE_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
