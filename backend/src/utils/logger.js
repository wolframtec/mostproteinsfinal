/**
 * Winston Logger Configuration
 * 
 * Provides structured logging for the application.
 * Logs to both console and files with different levels.
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { combine, timestamp, json, errors, printf, colorize } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Determine log level based on environment
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  defaultMeta: {
    service: 'mostproteins-api',
    environment: process.env.NODE_ENV || 'development',
  },
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true })
  ),
  transports: [
    // Console transport (with colors in development)
    new winston.transports.Console({
      format: combine(
        colorize(),
        consoleFormat
      ),
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      format: json(),
    }),
    
    // File transport for error logs only
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      format: json(),
    }),
  ],
  // Don't exit on uncaught errors
  exitOnError: false,
});

// Stream for Morgan HTTP logging integration
export const logStream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

// Helper functions for common log patterns
export const logPayment = (data) => {
  logger.info('Payment processed', {
    type: 'payment',
    ...data,
  });
};

export const logOrder = (data) => {
  logger.info('Order created', {
    type: 'order',
    ...data,
  });
};

export const logSecurity = (data) => {
  logger.warn('Security event', {
    type: 'security',
    ...data,
  });
};

export const logError = (error, context = {}) => {
  logger.error('Error occurred', {
    type: 'error',
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

export default logger;
