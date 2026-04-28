import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as auth from '../controllers/authController.js';

const router = express.Router();

router.post('/register', auth.register);
router.post('/login', auth.login);
router.get('/me', authMiddleware, auth.getUser);
router.get('/verify/:token', auth.verifyEmail);
router.post('/forgot-password', auth.forgotPassword);
router.post('/reset-password', auth.resetPassword);
router.patch('/profile', authMiddleware, auth.updateProfile);

export default router;
