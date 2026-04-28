import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { participantCheck } from '../middleware/participantCheck.js';
import * as pc from '../controllers/placeController.js';

const router = express.Router({ mergeParams: true });

router.use(authMiddleware, participantCheck);

router.get('/search', pc.searchPlaces);
router.get('/:placeId', pc.getPlaceDetail);

export default router;
