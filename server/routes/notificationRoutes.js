import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as nc from '../controllers/notificationController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', nc.getNotifications);
router.patch('/:id/read', nc.markRead);
router.patch('/read-all', nc.markAllRead);

export default router;
