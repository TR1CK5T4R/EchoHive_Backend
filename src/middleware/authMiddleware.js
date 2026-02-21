import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import UserService from '../services/userService.js';

/**
 * Protect routes by verifying JWT
 */
export const protect = asyncWrapper(async (req, res, next) => {
    let token;

    // 1. Extract token from Header or Cookies
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        const error = new Error('Not authorized to access this route. No token provided.');
        error.statusCode = 401;
        return next(error);
    }

    try {
        // 2. Verify token
        const decoded = jwt.verify(token, config.jwtSecret);

        // 3. Check if user still exists
        const currentUser = await UserService.getUserById(decoded.id);
        if (!currentUser) {
            const error = new Error('The user belonging to this token no longer exists.');
            error.statusCode = 401;
            return next(error);
        }

        // 4. Grant access to protected route
        req.user = currentUser;
        next();
    } catch (error) {
        const authError = new Error('Not authorized to access this route. Invalid token.');
        authError.statusCode = 401;
        next(authError);
    }
});

/**
 * Authorize certain roles (e.g., 'admin')
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            const error = new Error(`User role '${req.user.role}' is not authorized to access this route`);
            error.statusCode = 403;
            return next(error);
        }
        next();
    };
};
