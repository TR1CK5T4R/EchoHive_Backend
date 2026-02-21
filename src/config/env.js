import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Define and validate required environment variables
const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 5000,
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/louderworld',
    postgresUri: process.env.POSTGRES_URI || 'postgresql://user:password@localhost:5432/louderworld',
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    jwtSecret: process.env.JWT_SECRET || 'fallback_dev_secret_do_not_use_in_prod',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    }
};

// Validate critical variables in production
if (config.env === 'production') {
    const requiredFields = ['mongodbUri', 'postgresUri', 'googleClientId', 'jwtSecret'];
    for (const field of requiredFields) {
        if (!config[field]) {
            throw new Error(`Missing required environment variable for production: ${field}`);
        }
    }

    const cloudinaryFields = ['cloudName', 'apiKey', 'apiSecret'];
    for (const field of cloudinaryFields) {
        if (!config.cloudinary[field]) {
            throw new Error(`Missing required Cloudinary environment variable: ${field}`);
        }
    }
}

export default config;
