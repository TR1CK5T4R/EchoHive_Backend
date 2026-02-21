import express from 'express';
import { body } from 'express-validator';
import { optInToEvent } from '../controllers/optInController.js';

const router = express.Router();

/**
 * @desc    Opt-in to an event
 * @route   POST /api/opt-in
 * @access  Public
 */
router.post('/', [
    body('eventId').notEmpty().withMessage('Event ID is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail()
], optInToEvent);

export default router;
