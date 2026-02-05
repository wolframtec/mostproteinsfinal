/**
 * Request Logger Middleware
 * 
 * Logs all incoming requests with relevant information.
 * Helps with debugging and monitoring.
 */

import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export const requestLogger = (req, res, next) => {
  // Generate unique request ID
  req.id = uuidv4();
  
  // Record start time
  const startTime = Date.now();
  
  // Log request start
  logger.info('Request started', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    origin: req.get('origin'),
  });

  // Override res.json to capture response
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    res.responseBody = body;
    return originalJson(body);
  };

  // Log when response is finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    };

    // Log errors with more detail
    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', {
        ...logData,
        responseBody: res.responseBody,
      });
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

// Sanitize sensitive data from logs
export const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'cardNumber',
    'cvv',
    'cvc',
    'ssn',
    'creditCard',
  ];
  
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }
  
  return sanitized;
};

export default requestLogger;
