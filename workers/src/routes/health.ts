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

// Test Stripe connection
router.get('/stripe-test', async (request, env, ctx) => {
  if (!env.STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({
      success: false,
      error: 'STRIPE_SECRET_KEY not configured',
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  try {
    // Try to fetch account info from Stripe
    const response = await fetch('https://api.stripe.com/v1/account', {
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    if (!response.ok) {
      const error = await response.json() as { error?: { message?: string } };
      return new Response(JSON.stringify({
        success: false,
        error: error.error?.message || 'Failed to connect to Stripe',
        status: response.status,
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const account = await response.json() as { id: string; charges_enabled: boolean; payouts_enabled: boolean };
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Stripe connection successful',
      account: {
        id: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

export default router;
