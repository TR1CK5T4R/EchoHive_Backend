import axios from 'axios';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import UserService from '../services/userService.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
/**
 * Verify Google OAuth Token and Issue JWT
 * POST /api/auth/google
 */
export const googleLogin = asyncWrapper(async (req, res, next) => {
    const { token } = req.body;

    if (!token) {
        const error = new Error('Google token is required');
        error.statusCode = 400;
        return next(error);
    }

    try {
        // 1. Verify Google token via userinfo endpoint
        const googleResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const payload = googleResponse.data;

        const profile = {
            googleId: payload.sub,
            email: payload.email,
            name: payload.name,
            avatarUrl: payload.picture,
        };

        // 2. Find or Create User in Postgres
        const user = await UserService.findOrCreateUser(profile);

        // 3. Issue JWT
        const jwtToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            config.jwtSecret,
            { expiresIn: config.jwtExpiresIn }
        );

        // 4. (Optional but recommended) Set JWT as HTTP-Only Cookie
        res.cookie('jwt', jwtToken, {
            httpOnly: true,
            secure: config.env === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days matching JWT expiration
        });

        // 5. Respond with user data (excluding sensitive internal fields if any)
        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    avatarUrl: user.avatar_url,
                    role: user.role
                },
                token: jwtToken // Providing token in payload as well for clients that don't use cookies
            }
        });

    } catch (error) {
        console.error('Google OAuth Error:', error);
        const authError = new Error('Invalid Google token');
        authError.statusCode = 401;
        next(authError);
    }
});

/**
 * Logout user by clearing HTTP-Only cookie
 * POST /api/auth/logout
 */
export const logout = asyncWrapper(async (req, res) => {
    res.cookie('jwt', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
});

/**
 * Provide the current authenticated user's profile
 * GET /api/auth/me
 */
export const getMe = asyncWrapper(async (req, res) => {
    // req.user is populated by protect() middleware
    const user = await UserService.getUserById(req.user.id);

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
        success: true,
        data: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatar_url,
            role: user.role
        }
    });
});
