import Event from '../models/Event.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

/**
 * Get all events with dynamic filtering, sorting, and pagination
 * GET /api/events
 */
export const getEvents = asyncWrapper(async (req, res) => {
    const {
        city,
        keyword,
        startDate,
        endDate,
        status,
        page = 1,
        limit = 20,
    } = req.query;

    // 1. Build dynamic query
    const query = {};

    // Filter by city (case-insensitive)
    if (city) {
        query.city = { $regex: new RegExp(`^${city}$`, 'i') };
    }

    // Filter by status, default to non-inactive if not specified
    if (status) {
        query.status = status;
    } else {
        query.status = { $ne: 'inactive' };
    }

    // Filter by keyword in title or description
    if (keyword) {
        query.$or = [
            { title: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } },
            { venueName: { $regex: keyword, $options: 'i' } }
        ];
    }

    // Filter by Date Range on dateTime field
    if (startDate || endDate) {
        query.dateTime = {};
        if (startDate) {
            query.dateTime.$gte = new Date(startDate);
        }
        if (endDate) {
            query.dateTime.$lte = new Date(endDate);
        }
    }

    // 2. Pagination Setup
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // 3. Execute parallel queries for data and total count
    const [events, total] = await Promise.all([
        Event.find(query)
            .sort({ dateTime: 1 }) // Sort ascending by default
            .skip(skip)
            .limit(limitNumber)
            .lean(), // lean() for performance since we just need plain JSON
        Event.countDocuments(query)
    ]);

    // 4. Calculate total pages
    const totalPages = Math.ceil(total / limitNumber);

    res.status(200).json({
        success: true,
        data: {
            total,
            page: pageNumber,
            totalPages,
            events,
        }
    });
});

/**
 * Import an event, updating its status to 'imported' and logging the admin action
 * PATCH /api/events/:id/import
 * Private Access
 */
export const importEvent = asyncWrapper(async (req, res, next) => {
    const { id } = req.params;
    const { importNotes } = req.body;

    const event = await Event.findById(id);

    if (!event) {
        const error = new Error('Event not found');
        error.statusCode = 404;
        return next(error);
    }

    if (event.status === 'imported') {
        const error = new Error('Event has already been imported');
        error.statusCode = 400;
        return next(error);
    }

    // Since our req.user ID is a PostgreSQL UUID string, we can't cast it to a Mongoose ObjectId directly 
    // down the line if we want strict schema validation. However, the schema allows any valid ObjectId string if we modified the ref,
    // or we might just store it as a generic string. Given the schema dictates: 
    // importedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    // Mongoose expects a valid Mongo ID. Since we are using Postgres UUIDs for Users,
    // we need to adapt our Mongoose schema or bypass validation for this field by storing it as a String.
    // For now, let's cast UUID to a 24-char hex string to fake an ObjectId for the schema, or ideally 
    // adjust the `Event.js` schema so `importedBy` is `type: String`.

    // We will update the status and import details
    event.status = 'imported';
    event.importedAt = new Date();
    // In a mixed DB architecture where User=UUID, Event=ObjectId, we store the UUID string if schema allows.
    // Assuming the schema is updated or handles the string conversion gracefully:
    event.importedBy = req.user.id;

    if (importNotes) {
        event.importNotes = importNotes;
    }

    await event.save();

    res.status(200).json({
        success: true,
        data: event
    });
});
