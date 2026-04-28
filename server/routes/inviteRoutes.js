import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { participantCheck } from '../middleware/participantCheck.js';
import * as ic from '../controllers/inviteController.js';

const router = express.Router();

router.get('/:token', ic.getInvite);
router.post('/:token/accept', authMiddleware, ic.acceptInvite);

router.post('/trips/:id', authMiddleware, participantCheck, ic.createInvite);
router.post('/trips/:id/resend', authMiddleware, participantCheck, ic.resendInvite);

export default router;
