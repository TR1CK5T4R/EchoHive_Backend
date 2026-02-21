import { validationResult } from 'express-validator';

/**
 * Middleware that takes schemas from express-validator and evaluates them.
 * If errors exist, it traps the request and throws a localized 400 bad request.
 */
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }

    const extractedErrors = [];
    errors.array().forEach(err => extractedErrors.push({ [err.param || err.path]: err.msg }));

    return res.status(400).json({
        success: false,
        message: 'Data validation failed',
        errorCode: 400,
        errors: extractedErrors // Optional payload to specify exact missing parts
    });
};
