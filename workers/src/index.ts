/**
 * Most Proteins API - Cloudflare Worker
 * 
 * Edge-deployed backend for payment processing and order management.
 * Uses Cloudflare D1 for database and Stripe for payments.
 * 
 * Features:
 * - Order management with D1 database
 * - Stripe payment processing
 * - Webhook handling with signature verification
 * - Rate limiting and CORS protection
 * - Structured logging
 */

import { Router } from './utils/router';
import { handleCORS } from './middleware/cors';
import { rateLimit } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Import routes
import healthRoutes from './routes/health';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payments';
import webhookRoutes from './routes/webhooks';

// Environment variables type
export interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  ALLOWED_ORIGINS?: string;
  NODE_ENV?: string;
}

// Main fetch handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      const corsResponse = handleCORS(request, env);
      if (corsResponse) {
        return corsResponse;
      }
    }

    const url = new URL(request.url);
    const startTime = Date.now();

    try {
      // Create router
      const router = new Router();

      // Apply middleware
      router.use(requestLogger);
      router.use(rateLimit);

      // Register routes
      router.use('/api/health', healthRoutes);
      router.use('/api/orders', orderRoutes);
      router.use('/api/payments', paymentRoutes);
      router.use('/api/webhooks', webhookRoutes);

      // Handle request
      const response = await router.handle(request, env, ctx);
      
      // Add CORS headers and timing
      const endTime = Date.now();
      const modifiedResponse = addCORSHeaders(response, request, env);
      modifiedResponse.headers.set('X-Response-Time', `${endTime - startTime}ms`);
      
      return modifiedResponse;
    } catch (error) {
      console.error('Unhandled error:', error);
      return errorHandler(error, request);
    }
  },
};

// Helper function to add CORS headers
function addCORSHeaders(response: Response, request: Request, env: Env): Response {
  const origin = request.headers.get('Origin') || '*';
  const allowedOrigins = env.ALLOWED_ORIGINS 
    ? env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:5173', 'http://localhost:3000', 'https://mostproteins.com', 'https://*.pages.dev'];
  
  // Check if origin is allowed
  const isAllowed = allowedOrigins.includes(origin) || 
    allowedOrigins.some(allowed => allowed.includes('*') && new RegExp(allowed.replace('*', '.*')).test(origin));
  
  const corsHeaders = new Headers(response.headers);
  corsHeaders.set('Access-Control-Allow-Origin', isAllowed ? origin : allowedOrigins[0]);
  corsHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  corsHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Stripe-Signature');
  corsHeaders.set('Access-Control-Allow-Credentials', 'true');
  corsHeaders.set('Access-Control-Max-Age', '86400');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: corsHeaders,
  });
}
