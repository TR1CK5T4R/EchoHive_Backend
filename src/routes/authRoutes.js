import { Router } from 'express';
import { body } from 'express-validator';
import { googleLogin, logout, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Public routes
router.post(
    '/google',
    [
        body('token').notEmpty().withMessage('Google token is required')
    ],
    validate,
    googleLogin
);
router.post('/logout', logout);

// Protected routes
router.get('/me', protect, getMe);
router.get('/verify', protect, getMe);

export default router;
