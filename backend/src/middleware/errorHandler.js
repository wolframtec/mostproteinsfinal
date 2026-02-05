/**
 * Global Error Handler Middleware
 * 
 * Catches all errors and returns a consistent response format.
 * Logs errors for debugging but doesn't expose sensitive info to clients.
 */

import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Default error values
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorCode = 'FORBIDDEN';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
  } else if (err.type === 'StripeCardError') {
    statusCode = 400;
    errorCode = 'PAYMENT_ERROR';
    message = err.message; // Use Stripe's message for card errors
  } else if (err.type === 'StripeInvalidRequestError') {
    statusCode = 400;
    errorCode = 'INVALID_REQUEST';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'An unexpected error occurred. Please try again later.';
  }

  // Send response
  res.status(statusCode).json({
    error: {
      code: errorCode,
      message,
      // Only include stack trace in development
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
    requestId: req.id,
  });
};

// Custom error classes for common scenarios
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.code = 'VALIDATION_ERROR';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.code = 'NOT_FOUND';
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
    this.code = 'UNAUTHORIZED';
  }
}

export class PaymentError extends Error {
  constructor(message, stripeError = null) {
    super(message);
    this.name = 'PaymentError';
    this.statusCode = 400;
    this.code = 'PAYMENT_ERROR';
    this.stripeError = stripeError;
  }
}

export default errorHandler;
