import mongoose from 'mongoose';
import config from '../config/env.js';

const connectMongo = async () => {
    try {
        const conn = await mongoose.connect(config.mongodbUri);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Listen for errors after initial connection
        mongoose.connection.on('error', err => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected.');
        });

    } catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

export default connectMongo;
