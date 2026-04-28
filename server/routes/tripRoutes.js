import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { participantCheck } from '../middleware/participantCheck.js';
import { validateBody } from '../middleware/validateBody.js';
import { llmRateLimit } from '../middleware/rateLimiter.js';
import { preferencesSchema } from '../schemas/preferences.schema.js';
import * as tc from '../controllers/tripController.js';

const router = express.Router();

router.get('/', authMiddleware, tc.getMyTrips);
router.post('/', authMiddleware, tc.createTrip);

router.use('/:id', authMiddleware, participantCheck);

router.get('/:id', tc.getTrip);
router.patch('/:id', tc.updateTrip);
router.delete('/:id', tc.deleteTrip);

router.post('/:id/preferences', validateBody(preferencesSchema), tc.setPreferences);
router.get('/:id/preferences/me', tc.getMyPreferences);
router.get('/:id/preferences/partner', tc.getPartnerPreferences);

router.post('/:id/generate', llmRateLimit, tc.triggerGeneration);
router.get('/:id/generate/status', tc.getGenerationStatus);

export default router;
