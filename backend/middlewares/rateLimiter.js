// backend/middlewares/rateLimiter.js
import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints
 * Limits to 5 requests per 15 minutes per IP
 * Protects against brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: { 
    error: 'Too many login attempts. Please try again after 15 minutes.' 
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Rate limiter for password reset endpoints
 * More restrictive - 3 requests per 15 minutes
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per windowMs
  message: { 
    error: 'Too many password reset attempts. Please try again after 15 minutes.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiter
 * Limits to 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  message: { 
    error: 'Too many requests from this IP. Please try again after 15 minutes.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict limiter for sensitive operations
 * 10 requests per hour
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { 
    error: 'Rate limit exceeded. Please try again later.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});
