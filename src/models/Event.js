import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            index: true,
        },
        description: {
            type: String,
        },
        shortDescription: {
            type: String,
        },
        dateTime: {
            type: Date,
            index: true,
        },
        venueName: {
            type: String,
        },
        venueAddress: {
            type: String,
        },
        city: {
            type: String,
            default: 'Sydney',
            index: true,
        },
        category: [
            {
                type: String,
            },
        ],
        imageUrl: {
            type: String,
        },
        sourceWebsite: {
            type: String,
            required: true,
        },
        originalEventUrl: {
            type: String,
            required: true,
            unique: true,
        },
        lastScrapedAt: {
            type: Date,
        },
        contentHash: {
            type: String, // Used for detecting changes during scraping/importing
        },
        status: {
            type: String,
            enum: ['new', 'updated', 'inactive', 'imported'],
            default: 'new',
        },

        // Import fields
        importedAt: {
            type: Date,
        },
        importedBy: {
            type: String, // Changed to String to accommodate PostgreSQL UUIDs
        },
        importNotes: {
            type: String,
        },
    },
    {
        timestamps: true, // Automatically manages createdAt and updatedAt
    }
);

// Compound index optimized for filtering by city and dateTime
eventSchema.index({ city: 1, dateTime: 1 });

// Pre-save hook to update status if modified
eventSchema.pre('save', function () {
    // Check if the document is NOT new, and if fields other than 'status', 'lastScrapedAt', etc., were modified
    if (!this.isNew) {
        const modifiedPaths = this.modifiedPaths();

        // Create a list of fields that, when changed, should trigger an 'updated' status
        const criticalFieldsChanged = modifiedPaths.some(path =>
            !['status', 'lastScrapedAt', 'updatedAt', 'importedAt', 'importedBy', 'importNotes'].includes(path)
        );

        if (criticalFieldsChanged && this.status !== 'imported') {
            this.status = 'updated';
        }
    }
});

const Event = mongoose.model('Event', eventSchema);

export default Event;
