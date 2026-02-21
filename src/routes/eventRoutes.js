import { Router } from 'express';
import { param, body } from 'express-validator';
import { getEvents, importEvent } from '../controllers/eventController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Public routes
router.get('/', getEvents);

// Protected routes
// Requires user to be logged in. You can also chain `authorize('admin')` if needed
router.patch(
    '/:id/import',
    protect,
    [
        param('id').isMongoId().withMessage('Invalid event ID format'),
        body('importNotes').optional().isString().trim().isLength({ max: 500 }).withMessage('Notes exceed 500 characters')
    ],
    validate,
    importEvent
);

export default router;
