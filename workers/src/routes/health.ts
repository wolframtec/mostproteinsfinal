/**
 * Health check routes
 */

import { Router } from '../utils/router';
import { Env } from '../index';

const router = new Router();

// Health check endpoint
router.get('/', async (request, env, ctx) => {
  // Check database connection
  let dbStatus = 'ok';
  try {
    const result = await env.DB.prepare('SELECT 1 as health_check').first();
    if (!result) {
      dbStatus = 'error';
    }
  } catch (error) {
    console.error('Database health check failed:', error);
    dbStatus = 'error';
  }
  
  // Check Stripe configuration
  const stripeConfigured = !!env.STRIPE_SECRET_KEY;
  const webhookConfigured = !!env.STRIPE_WEBHOOK_SECRET;
  
  const health = {
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: env.NODE_ENV || 'development',
    checks: {
      database: dbStatus,
      stripe: stripeConfigured ? 'configured' : 'not_configured',
      webhooks: webhookConfigured ? 'configured' : 'not_configured',
    },
  };
  
  const statusCode = dbStatus === 'ok' ? 200 : 503;
  
  return new Response(JSON.stringify(health), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
});

// Detailed health check (for admin/monitoring)
router.get('/detailed', async (request, env, ctx) => {
  // This could include more detailed metrics in the future
  const detailed = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: 'N/A', // Workers are stateless, no uptime tracking
    version: '2.0.0',
    features: {
      payments: !!env.STRIPE_SECRET_KEY,
      webhooks: !!env.STRIPE_WEBHOOK_SECRET,
      database: true,
    },
  };
  
  return new Response(JSON.stringify(detailed), {
    headers: { 'Content-Type': 'application/json' },
  });
});

export default router;
