/**
 * Payment processing routes
 * Integrates with Stripe for payment intents
 */

import { Router } from '../utils/router';
import { Env } from '../index';
import { validatePaymentIntent } from '../utils/validators';
import { createPaymentIntent, retrievePaymentIntent } from '../utils/stripe';
import { formatDate } from '../utils/helpers';
import { logInfo, logError } from '../middleware/requestLogger';

const router = new Router();

// Create payment intent
router.post('/create-intent', async (request, env, ctx) => {
  try {
    const data = await request.json() as Record<string, unknown>;
    
    // Validate input
    const validation = validatePaymentIntent(data);
    if (!validation.valid) {
      return new Response(JSON.stringify({
        error: 'Validation failed',
        message: validation.message,
        errors: validation.errors,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const { amount, currency = 'usd', orderId, customerEmail } = data as {
      amount: number;
      currency: string;
      orderId: string;
      customerEmail?: string;
    };
    
    // Check if Stripe is configured
    if (!env.STRIPE_SECRET_KEY) {
      return new Response(JSON.stringify({
        error: 'Payment service not configured',
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Create payment intent with Stripe
    const paymentIntent = await createPaymentIntent({
      amount,
      currency,
      orderId,
      customerEmail: customerEmail || '',
    }, env.STRIPE_SECRET_KEY);
    
    // Update order with payment intent ID
    await env.DB.prepare(`
      UPDATE orders SET payment_intent_id = ?, updated_at = ? WHERE id = ?
    `).bind(paymentIntent.id, formatDate(), orderId).run();
    
    // Log payment event
    await env.DB.prepare(`
      INSERT INTO payment_audit_log (order_id, payment_intent_id, event_type, amount, currency, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(orderId, paymentIntent.id, 'payment_intent.created', amount, currency, paymentIntent.status).run();
    
    logInfo('Payment intent created', { 
      orderId, 
      paymentIntentId: paymentIntent.id,
      amount,
      currency 
    });
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    logError('Failed to create payment intent', error);
    return new Response(JSON.stringify({
      error: 'Payment creation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// Get payment status
router.get('/:id/status', async (request, env, ctx, params) => {
  try {
    const paymentIntentId = params?.id;
    
    if (!paymentIntentId) {
      return new Response(JSON.stringify({ error: 'Payment Intent ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (!env.STRIPE_SECRET_KEY) {
      return new Response(JSON.stringify({
        error: 'Payment service not configured',
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Retrieve from Stripe
    const paymentIntent = await retrievePaymentIntent(paymentIntentId, env.STRIPE_SECRET_KEY);
    
    return new Response(JSON.stringify({
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      receiptUrl: paymentIntent.charges?.data[0]?.receipt_url,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    logError('Failed to get payment status', error);
    return new Response(JSON.stringify({
      error: 'Failed to retrieve payment status',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// Get payment details from database
router.get('/order/:orderId', async (request, env, ctx, params) => {
  try {
    const orderId = params?.orderId;
    
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Order ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Get payment audit log for order
    const logsResult = await env.DB.prepare(`
      SELECT * FROM payment_audit_log 
      WHERE order_id = ? 
      ORDER BY timestamp DESC
    `).bind(orderId).all();
    
    // Get order payment info
    const order = await env.DB.prepare(`
      SELECT payment_intent_id, status, total, currency 
      FROM orders 
      WHERE id = ?
    `).bind(orderId).first();
    
    return new Response(JSON.stringify({
      orderId,
      orderStatus: order?.status,
      paymentIntentId: order?.payment_intent_id,
      total: order?.total,
      currency: order?.currency,
      events: logsResult.results || [],
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    logError('Failed to get order payments', error);
    return new Response(JSON.stringify({
      error: 'Failed to retrieve payment information',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

export default router;
