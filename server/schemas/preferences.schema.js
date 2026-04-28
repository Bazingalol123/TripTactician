import { z } from 'zod';

export const preferencesSchema = z.object({
  pace: z.enum(['relaxed', 'moderate', 'packed']),
  interests: z.array(z.enum([
    'food', 'culture', 'nature', 'nightlife', 'shopping', 'adventure', 'wellness',
  ])).min(1),
  morningPerson: z.boolean(),
  hardAvoids: z.string().max(200).optional(),
});
