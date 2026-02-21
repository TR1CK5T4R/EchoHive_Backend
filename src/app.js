import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import { errorHandler } from './middleware/errorHandler.js';
import config from './config/env.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import optInRoutes from './routes/optInRoutes.js';

const app = express();

// Security Middlewares
app.use(helmet()); // Set security HTTP headers
app.use(cors()); // Enable CORS

// Rate limiting (max 100 requests per 15 minutes per IP)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again in 15 minutes',
});
app.use('/api', limiter);

// Logging
if (config.env === 'development') {
    app.use(morgan('dev')); // Detailed colored HTTP request logger for local dev
} else {
    app.use(morgan('combined')); // Standard Apache combined log output for production 
}

// Body Parser
app.use(express.json({ limit: '10kb' })); // Parse JSON payloads & limit body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser()); // Parse Cookie headers for JWT

// Data Sanitization
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS by escaping malicious HTML code

// Routes
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/opt-in', optInRoutes);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
});

// Global Error Handler (must be the last middleware)
app.use(errorHandler);

export default app;
