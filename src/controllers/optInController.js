import Event from '../models/Event.js';
import OptIn from '../models/OptIn.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import { validationResult } from 'express-validator';

/**
 * Register a user for an event tickets / opt-in
 * POST /api/opt-in
 */
export const optInToEvent = asyncWrapper(async (req, res, next) => {
    // 1. Validation Setup
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation Failed');
        error.statusCode = 400;
        error.data = errors.array();
        return next(error);
    }

    const { eventId, email } = req.body;

    // 2. Fetch the Event to ensure it exists
    const event = await Event.findById(eventId);
    if (!event) {
        const error = new Error('Event not found');
        error.statusCode = 404;
        return next(error);
    }

    // 3. Prevent duplicate registrations
    const existingOptIn = await OptIn.findOne({ eventId, email });
    if (existingOptIn) {
        const error = new Error('You have already registered for this event');
        error.statusCode = 409; // Conflict
        return next(error);
    }

    // 4. Create the Opt-In
    const newOptIn = await OptIn.create({
        eventId,
        email
    });

    res.status(201).json({
        success: true,
        message: 'Successfully registered for event tickets!',
        data: newOptIn
    });
});
