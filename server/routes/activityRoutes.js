import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { participantCheck } from '../middleware/participantCheck.js';
import { validateBody } from '../middleware/validateBody.js';
import * as ac from '../controllers/activityController.js';

const router = express.Router({ mergeParams: true });

router.use(authMiddleware, participantCheck);

router.get('/', ac.getActivities);
router.post('/', ac.addActivity);
router.patch('/:activityId', ac.updateActivity);
router.delete('/:activityId', ac.removeActivity);
router.post('/reorder', ac.reorderActivities);
router.post('/fill-gaps', ac.fillGaps);

export default router;
