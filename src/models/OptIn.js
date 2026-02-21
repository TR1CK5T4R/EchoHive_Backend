import mongoose from 'mongoose';

const optInSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    }
}, {
    timestamps: true
});

// Prevent same email from opting into the same event multiple times
optInSchema.index({ eventId: 1, email: 1 }, { unique: true });

export default mongoose.model('OptIn', optInSchema);
