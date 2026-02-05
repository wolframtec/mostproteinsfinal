/**
 * Stripe Service
 * 
 * Handles all Stripe-related operations including:
 * - Payment Intent creation
 * - Payment confirmation
 * - Refund processing
 * - Webhook handling
 */

import Stripe from 'stripe';
import { logger, logPayment } from '../utils/logger.js';
import { PaymentError } from '../middleware/errorHandler.js';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: false,
});

// Verify Stripe key on startup
const verifyStripeKey = async () => {
  try {
    await stripe.balance.retrieve();
    logger.info(`Stripe connected successfully (${process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? 'LIVE' : 'TEST'} mode)`);
    return true;
  } catch (error) {
    logger.error('Failed to connect to Stripe:', error.message);
    return false;
  }
};

/**
 * Create a PaymentIntent
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Amount in cents
 * @param {string} params.currency - Currency code (default: 'usd')
 * @param {Object} params.metadata - Additional metadata
 * @param {string} params.customerEmail - Customer email for receipt
 * @returns {Promise<Object>} PaymentIntent object
 */
export const createPaymentIntent = async ({
  amount,
  currency = 'usd',
  metadata = {},
  customerEmail,
}) => {
  try {
    // Validate amount
    if (!amount || amount < 50) { // Minimum 50 cents
      throw new PaymentError('Amount must be at least $0.50');
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
      },
      receipt_email: customerEmail,
      // Enable 3D Secure for cards that require it
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
    });

    logger.info('PaymentIntent created', {
      paymentIntentId: paymentIntent.id,
      amount,
      currency,
      metadata,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      currency,
      status: paymentIntent.status,
    };
  } catch (error) {
    logger.error('Failed to create PaymentIntent:', {
      error: error.message,
      amount,
      currency,
    });
    
    if (error.type === 'StripeError') {
      throw new PaymentError(error.message, error);
    }
    throw error;
  }
};

/**
 * Retrieve a PaymentIntent
 * @param {string} paymentIntentId - Stripe PaymentIntent ID
 * @returns {Promise<Object>} PaymentIntent object
 */
export const retrievePaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    logger.error('Failed to retrieve PaymentIntent:', {
      paymentIntentId,
      error: error.message,
    });
    throw new PaymentError('Failed to retrieve payment information', error);
  }
};

/**
 * Confirm a PaymentIntent (for manual confirmation flow)
 * @param {string} paymentIntentId - Stripe PaymentIntent ID
 * @param {string} paymentMethodId - Stripe PaymentMethod ID
 * @returns {Promise<Object>} Confirmed PaymentIntent
 */
export const confirmPaymentIntent = async (paymentIntentId, paymentMethodId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });

    logger.info('PaymentIntent confirmed', {
      paymentIntentId,
      status: paymentIntent.status,
    });

    return paymentIntent;
  } catch (error) {
    logger.error('Failed to confirm PaymentIntent:', {
      paymentIntentId,
      paymentMethodId,
      error: error.message,
    });
    throw new PaymentError(error.message, error);
  }
};

/**
 * Create a refund
 * @param {string} paymentIntentId - Stripe PaymentIntent ID
 * @param {number} amount - Amount to refund in cents (optional, refunds full amount if not provided)
 * @param {string} reason - Reason for refund
 * @returns {Promise<Object>} Refund object
 */
export const createRefund = async (paymentIntentId, amount = null, reason = '') => {
  try {
    const refundData = {
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
      metadata: {
        requestedAt: new Date().toISOString(),
        reason,
      },
    };

    if (amount) {
      refundData.amount = amount;
    }

    const refund = await stripe.refunds.create(refundData);

    logger.info('Refund created', {
      refundId: refund.id,
      paymentIntentId,
      amount: refund.amount,
      status: refund.status,
    });

    return refund;
  } catch (error) {
    logger.error('Failed to create refund:', {
      paymentIntentId,
      error: error.message,
    });
    throw new PaymentError('Failed to process refund', error);
  }
};

/**
 * Handle Stripe webhook events
 * @param {string} payload - Raw request body
 * @param {string} signature - Stripe signature header
 * @returns {Promise<Object>} Webhook event object
 */
export const handleWebhook = async (payload, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    logger.info('Webhook received', {
      type: event.type,
      id: event.id,
    });

    // Handle specific event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      
      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;
      
      default:
        logger.info(`Unhandled webhook event type: ${event.type}`);
    }

    return event;
  } catch (error) {
    logger.error('Webhook error:', error.message);
    throw error;
  }
};

/**
 * Handle successful payment
 * @param {Object} paymentIntent - Stripe PaymentIntent object
 */
const handlePaymentSuccess = async (paymentIntent) => {
  logPayment({
    event: 'payment_success',
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    customer: paymentIntent.customer,
    metadata: paymentIntent.metadata,
  });

  // TODO: Send order confirmation email
  // TODO: Update order status in database
  // TODO: Notify admin of new order
};

/**
 * Handle failed payment
 * @param {Object} paymentIntent - Stripe PaymentIntent object
 */
const handlePaymentFailure = async (paymentIntent) => {
  logger.warn('Payment failed', {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    error: paymentIntent.last_payment_error,
  });

  // TODO: Send payment failure notification to customer
  // TODO: Update order status in database
};

/**
 * Handle refund
 * @param {Object} charge - Stripe Charge object
 */
const handleRefund = async (charge) => {
  logger.info('Refund processed', {
    chargeId: charge.id,
    amount: charge.amount_refunded,
  });

  // TODO: Send refund confirmation email
  // TODO: Update order status in database
};

/**
 * Format amount for display
 * @param {number} amount - Amount in cents
 * @param {string} currency - Currency code
 * @returns {string} Formatted amount
 */
export const formatAmount = (amount, currency = 'usd') => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  });
  return formatter.format(amount / 100);
};

// Export Stripe instance for direct access if needed
export { stripe, verifyStripeKey };

export default {
  createPaymentIntent,
  retrievePaymentIntent,
  confirmPaymentIntent,
  createRefund,
  handleWebhook,
  formatAmount,
  verifyStripeKey,
  stripe,
};
