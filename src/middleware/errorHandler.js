import config from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Example: Handle specific Mongoose or Postgres errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }

    if (err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate field value entered';
    }

    // Postgres unique constraint violation
    if (err.code === '23505') {
        statusCode = 409;
        message = 'Duplicate database entry';
    }

    const errorResponse = {
        success: false,
        message: message,
        errorCode: statusCode
    };

    if (config.env === 'development') {
        errorResponse.stack = err.stack;
    }

    res.status(statusCode).json(errorResponse);
};
