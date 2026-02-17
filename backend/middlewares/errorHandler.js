// backend/middlewares/errorHandler.js

/**
 * 🔒 SECURITY: Global Error Handler
 * Sanitizes error responses to prevent sensitive information disclosure
 */

// List of error types that are safe to expose to client
const CLIENT_SAFE_ERRORS = [
  'ValidationError',
  'CastError', // MongoDB ObjectId cast error
];

/**
 * Determine if error message is safe to show to client
 */
const isSafeErrorMessage = (message) => {
  // These patterns are safe to show
  const safePatterns = [
    /required/i,
    /invalid/i,
    /not found/i,
    /already exists/i,
    /duplicate/i,
    /unauthorized/i,
    /forbidden/i,
    /too many/i,
    /locked/i,
    /expired/i,
  ];
  
  return safePatterns.some(pattern => pattern.test(message));
};

/**
 * Global error handler middleware
 * Must be registered LAST in middleware chain
 */
export const errorHandler = (err, req, res, next) => {
  console.error('🚨 [errorHandler] Error caught:', {
    name: err.name,
    message: err.message,
    path: req.path,
    method: req.method,
    // Only log stack in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });

  // Default error response
  let statusCode = err.statusCode || err.status || 500;
  let message = 'An error occurred. Please try again later.';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors || {}).map(e => e.message);
    message = messages.length > 0 ? messages[0] : 'Validation failed.';
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0];
    message = field 
      ? `A record with this ${field} already exists.`
      : 'Duplicate entry detected.';
  }

  // MongoDB CastError (invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Invalid ID format.';
  }

  // JWT errors (already handled in authMiddleware, but backup here)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired. Please log in again.';
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large. Maximum size is 5MB.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field.';
        break;
      default:
        message = 'File upload failed.';
    }
  }

  // Stripe errors
  if (err.type && err.type.startsWith('Stripe')) {
    statusCode = 400;
    message = 'Payment processing error. Please try again.';
  }

  // If error message is safe, use it
  if (err.message && isSafeErrorMessage(err.message)) {
    message = err.message;
  }

  // In development, include more details
  const response = {
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      debug: {
        name: err.name,
        originalMessage: err.message,
        stack: err.stack?.split('\n').slice(0, 5)
      }
    })
  };

  res.status(statusCode).json(response);
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req, res) => {
  console.log(`❌ [notFoundHandler] 404: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'The requested resource was not found.' 
  });
};

export default errorHandler;
