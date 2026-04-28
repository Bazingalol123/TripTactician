import { z } from 'zod';

export const itinerarySchema = z.object({
  days: z.array(z.object({
    dayNumber: z.number().int().positive(),
    label: z.string().max(30),
    activities: z.array(z.object({
      placeId: z.string(),
      order: z.number().nullable(),
      timeOfDay: z.enum(['morning', 'afternoon', 'evening']).nullable(),
      conflict: z.object({
        flagged: z.boolean(),
        partner: z.enum(['A', 'B']).nullable(),
        reason: z.string().max(80).nullable(),
      }),
    })),
  })),
});
