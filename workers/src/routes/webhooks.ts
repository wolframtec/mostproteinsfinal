/**
 * Stripe webhook routes
 * Handles payment events from Stripe
 */

import { Router } from '../utils/router';
import { Env } from '../index';
import { verifyStripeSignature } from '../utils/stripe';
import { formatDate } from '../utils/helpers';
import { logInfo, logError } from '../middleware/requestLogger';

const router = new Router();

// Stripe webhook endpoint
router.post('/stripe', async (request, env, ctx) => {
  try {
    // Get raw body for signature verification
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      logError('Webhook missing signature');
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (!env.STRIPE_WEBHOOK_SECRET) {
      logError('Webhook secret not configured');
      return new Response(JSON.stringify({ error: 'Webhook not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Verify webhook signature
    const isValid = await verifyStripeSignature(payload, signature, env.STRIPE_WEBHOOK_SECRET);
    if (!isValid) {
      logError('Webhook invalid signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Parse event
    const event = JSON.parse(payload);
    
    logInfo('Webhook received', { 
      type: event.type, 
      id: event.id,
      livemode: event.livemode 
    });
    
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object, env);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object, env);
        break;
        
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object, env);
        break;
        
      case 'charge.refunded':
        await handleRefund(event.data.object, env);
        break;
        
      case 'charge.dispute.created':
        await handleDispute(event.data.object, env);
        break;
        
      default:
        logInfo('Unhandled webhook event type', { type: event.type });
    }
    
    // Acknowledge receipt
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    logError('Webhook processing error', error);
    return new Response(JSON.stringify({ 
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// Handle successful payment
async function handlePaymentSuccess(paymentIntent: Record<string, unknown>, env: Env): Promise<void> {
  const orderId = (paymentIntent.metadata as Record<string, string>)?.order_id;
  const paymentIntentId = paymentIntent.id as string;
  
  if (!orderId) {
    logError('Payment success webhook missing order_id', null, { paymentIntentId });
    return;
  }
  
  const now = formatDate();
  
  try {
    // Update order status to paid
    await env.DB.prepare(`
      UPDATE orders SET status = 'paid', updated_at = ? WHERE id = ?
    `).bind(now, orderId).run();
    
    // Add status history
    await env.DB.prepare(`
      INSERT INTO order_status_history (order_id, status, notes, timestamp)
      VALUES (?, ?, ?, ?)
    `).bind(orderId, 'paid', `Payment confirmed: ${paymentIntentId}`, now).run();
    
    // Log payment event
    await env.DB.prepare(`
      INSERT INTO payment_audit_log (order_id, payment_intent_id, event_type, amount, currency, status, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderId,
      paymentIntentId,
      'payment_intent.succeeded',
      paymentIntent.amount,
      paymentIntent.currency,
      paymentIntent.status,
      JSON.stringify({
        receipt_email: paymentIntent.receipt_email,
        charges: paymentIntent.charges,
      })
    ).run();
    
    logInfo('Payment succeeded', { orderId, paymentIntentId });
    
    // TODO: Send confirmation email (integrate with SendGrid/Resend)
    // await sendOrderConfirmationEmail(orderId, env);
    
  } catch (error) {
    logError('Failed to process payment success', error, { orderId, paymentIntentId });
    throw error;
  }
}

// Handle failed payment
async function handlePaymentFailure(paymentIntent: Record<string, unknown>, env: Env): Promise<void> {
  const orderId = (paymentIntent.metadata as Record<string, string>)?.order_id;
  const paymentIntentId = paymentIntent.id as string;
  const lastPaymentError = paymentIntent.last_payment_error as Record<string, string>;
  
  if (!orderId) {
    logError('Payment failure webhook missing order_id', null, { paymentIntentId });
    return;
  }
  
  const now = formatDate();
  const errorMessage = lastPaymentError?.message || 'Payment failed';
  
  try {
    // Update order status
    await env.DB.prepare(`
      UPDATE orders SET status = 'payment_failed', updated_at = ? WHERE id = ?
    `).bind(now, orderId).run();
    
    // Add status history
    await env.DB.prepare(`
      INSERT INTO order_status_history (order_id, status, notes, timestamp)
      VALUES (?, ?, ?, ?)
    `).bind(orderId, 'payment_failed', errorMessage, now).run();
    
    // Log payment event
    await env.DB.prepare(`
      INSERT INTO payment_audit_log (order_id, payment_intent_id, event_type, amount, currency, status, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderId,
      paymentIntentId,
      'payment_intent.payment_failed',
      paymentIntent.amount,
      paymentIntent.currency,
      'failed',
      JSON.stringify({ error: errorMessage })
    ).run();
    
    logInfo('Payment failed', { orderId, paymentIntentId, error: errorMessage });
    
  } catch (error) {
    logError('Failed to process payment failure', error, { orderId, paymentIntentId });
    throw error;
  }
}

// Handle canceled payment
async function handlePaymentCanceled(paymentIntent: Record<string, unknown>, env: Env): Promise<void> {
  const orderId = (paymentIntent.metadata as Record<string, string>)?.order_id;
  const paymentIntentId = paymentIntent.id as string;
  
  if (!orderId) return;
  
  const now = formatDate();
  
  try {
    await env.DB.prepare(`
      UPDATE orders SET status = 'canceled', updated_at = ? WHERE id = ?
    `).bind(now, orderId).run();
    
    await env.DB.prepare(`
      INSERT INTO order_status_history (order_id, status, timestamp)
      VALUES (?, ?, ?)
    `).bind(orderId, 'canceled', now).run();
    
    logInfo('Payment canceled', { orderId, paymentIntentId });
    
  } catch (error) {
    logError('Failed to process payment cancelation', error, { orderId });
  }
}

// Handle refund
async function handleRefund(charge: Record<string, unknown>, env: Env): Promise<void> {
  const paymentIntentId = charge.payment_intent as string;
  const refundAmount = charge.amount_refunded as number;
  
  if (!paymentIntentId) return;
  
  try {
    // Find order by payment intent ID
    const order = await env.DB.prepare(`
      SELECT id FROM orders WHERE payment_intent_id = ?
    `).bind(paymentIntentId).first();
    
    if (!order) {
      logError('Refund webhook: order not found', null, { paymentIntentId });
      return;
    }
    
    const now = formatDate();
    
    await env.DB.prepare(`
      UPDATE orders SET status = 'refunded', updated_at = ? WHERE id = ?
    `).bind(now, order.id).run();
    
    await env.DB.prepare(`
      INSERT INTO order_status_history (order_id, status, notes, timestamp)
      VALUES (?, ?, ?, ?)
    `).bind(order.id, 'refunded', `Refunded: $${refundAmount / 100}`, now).run();
    
    logInfo('Order refunded', { orderId: order.id, paymentIntentId, amount: refundAmount });
    
  } catch (error) {
    logError('Failed to process refund', error, { paymentIntentId });
  }
}

// Handle dispute
async function handleDispute(dispute: Record<string, unknown>, env: Env): Promise<void> {
  const chargeId = dispute.charge as string;
  
  logError('Dispute created', null, { 
    disputeId: dispute.id,
    chargeId,
    amount: dispute.amount,
    reason: dispute.reason 
  });
  
  // TODO: Send alert notification for manual review
}

export default router;
