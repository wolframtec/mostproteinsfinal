/**
 * Request logging middleware
 * Logs request details for debugging and monitoring
 */

import { Handler } from '../utils/router';
import { Env } from '../index';
import { getClientIP, getUserAgent, maskSensitiveData } from '../utils/helpers';

export const requestLogger: Handler = async (request, env, ctx) => {
  const url = new URL(request.url);
  const startTime = Date.now();
  
  // Log request details
  const logData = {
    timestamp: new Date().toISOString(),
    method: request.method,
    path: url.pathname,
    query: url.search,
    ip: getClientIP(request),
    userAgent: getUserAgent(request),
    cfRay: request.headers.get('cf-ray'),
    cfCountry: request.headers.get('cf-ipcountry'),
  };
  
  console.log('Request:', JSON.stringify(logData));
  
  // Continue processing (return 404 to let router handle actual route)
  return new Response(null, { status: 404 });
};

// Structured logger for consistent log format
export function logInfo(message: string, data?: Record<string, unknown>): void {
  console.log(JSON.stringify({
    level: 'info',
    timestamp: new Date().toISOString(),
    message,
    ...data,
  }));
}

export function logError(message: string, error?: unknown, data?: Record<string, unknown>): void {
  console.error(JSON.stringify({
    level: 'error',
    timestamp: new Date().toISOString(),
    message,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...data,
  }));
}

export function logWarn(message: string, data?: Record<string, unknown>): void {
  console.warn(JSON.stringify({
    level: 'warn',
    timestamp: new Date().toISOString(),
    message,
    ...data,
  }));
}
