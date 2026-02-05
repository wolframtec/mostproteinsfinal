/**
 * Error handling middleware
 */

import { Env } from '../index';

export function errorHandler(error: unknown, request: Request): Response {
  const url = new URL(request.url);
  
  console.error('Error handling request:', {
    path: url.pathname,
    method: request.method,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  
  // Determine if it's a known error type
  if (error instanceof Response) {
    return error;
  }
  
  // Database errors
  if (error instanceof Error && error.message.includes('D1_ERROR')) {
    return new Response(
      JSON.stringify({
        error: 'Database Error',
        message: 'An error occurred while accessing the database. Please try again.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  // Stripe errors
  if (error instanceof Error && error.message.includes('Stripe')) {
    return new Response(
      JSON.stringify({
        error: 'Payment Error',
        message: 'An error occurred while processing your payment. Please try again.',
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  // Validation errors
  if (error instanceof Error && error.message.includes('Validation')) {
    return new Response(
      JSON.stringify({
        error: 'Validation Error',
        message: error.message,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  // Default error response
  return new Response(
    JSON.stringify({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred. Please try again later.',
      requestId: crypto.randomUUID(),
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// Custom error classes
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentError';
  }
}
