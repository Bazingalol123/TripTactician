import { z } from 'zod';

export const searchParamsSchema = z.object({
  categories: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening']).nullable().default(null),
  maxPriceLevel: z.number().min(0).max(4).nullable().default(null),
  nearPlaceType: z.string().nullable().default(null),
});
