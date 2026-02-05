import express from 'express';
import stripeService from '../services/stripeService.js';
import emailService from '../services/emailService.js';
import logger from '../utils/logger.js';
import { getOrderById, updateOrderStatus, logPaymentEvent } from '../database/index.js';

const router = express.Router();

/**
 * @route   POST /api/webhooks/stripe
 * @desc    Handle Stripe webhooks
 * @access  Public (secured by Stripe signature)
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig) {
    logger.warn('Stripe webhook missing signature', { ip: req.ip });
    return res.status(400).send('Webhook signature missing');
  }

  if (!endpointSecret) {
    logger.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  let event;

  try {
    event = stripeService.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed', {
      error: err.message,
      ip: req.ip
    });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  logger.info('Stripe webhook received', {
    type: event.type,
    id: event.id
  });

  try {
    switch (event.type) {
      case 'payment_intent.created': {
        const paymentIntent = event.data.object;
        logger.info('Payment intent created via webhook', {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount
        });
        break;
      }

      case 'payment_intent.requires_action': {
        const paymentIntent = event.data.object;
        logger.info('Payment intent requires action', {
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret
        });
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const errorMessage = paymentIntent.last_payment_error?.message || 'Unknown error';
        const orderId = paymentIntent.metadata?.order_id;

        logger.warn('Payment failed', {
          paymentIntentId: paymentIntent.id,
          error: errorMessage,
          orderId
        });

        // Log payment event
        if (orderId) {
          logPaymentEvent({
            orderId,
            paymentIntentId: paymentIntent.id,
            eventType: 'payment_failed',
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: 'failed',
            metadata: { error: errorMessage }
          });

          // Update order status
          try {
            updateOrderStatus(orderId, 'payment_failed', paymentIntent.id);
          } catch (dbError) {
            logger.error('Failed to update order status', { orderId, error: dbError.message });
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.order_id;

        logger.info('Payment succeeded', {
          paymentIntentId: paymentIntent.id,
          orderId,
          amount: paymentIntent.amount,
          receiptEmail: paymentIntent.receipt_email
        });

        if (orderId) {
          // Log payment event
          logPaymentEvent({
            orderId,
            paymentIntentId: paymentIntent.id,
            eventType: 'payment_succeeded',
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: 'succeeded'
          });

          // Update order status to paid
          try {
            updateOrderStatus(orderId, 'paid', paymentIntent.id);
            logger.info('Order marked as paid', { orderId });
          } catch (dbError) {
            logger.error('Failed to update order status', { orderId, error: dbError.message });
          }

          // Send order confirmation email
          try {
            const order = getOrderById(orderId);
            if (order && paymentIntent.receipt_email) {
              await emailService.sendOrderConfirmation({
                to: paymentIntent.receipt_email,
                orderId,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                items: order.items || []
              });
              logger.info('Order confirmation email sent', {
                orderId,
                email: paymentIntent.receipt_email
              });
            }
          } catch (emailError) {
            logger.error('Failed to send order confirmation email', {
              error: emailError.message,
              orderId
            });
          }
        }
        break;
      }

      case 'charge.succeeded': {
        const charge = event.data.object;
        logger.info('Charge succeeded', {
          chargeId: charge.id,
          paymentIntentId: charge.payment_intent,
          amount: charge.amount,
          receiptUrl: charge.receipt_url
        });
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const orderId = charge.metadata?.order_id;

        logger.info('Charge refunded', {
          chargeId: charge.id,
          amountRefunded: charge.amount_refunded,
          refundReason: charge.refunds?.data[0]?.reason
        });

        if (orderId) {
          // Log refund event
          logPaymentEvent({
            orderId,
            paymentIntentId: charge.payment_intent,
            eventType: 'charge_refunded',
            amount: charge.amount_refunded,
            currency: charge.currency,
            status: 'refunded'
          });

          // Update order status
          try {
            updateOrderStatus(orderId, 'refunded');
          } catch (dbError) {
            logger.error('Failed to update order status for refund', { orderId, error: dbError.message });
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        logger.info('Invoice payment succeeded', {
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription,
          customerId: invoice.customer
        });
        break;
      }

      case 'customer.created': {
        const customer = event.data.object;
        logger.info('Customer created', {
          customerId: customer.id,
          email: customer.email
        });
        break;
      }

      case 'account.updated': {
        const account = event.data.object;
        logger.info('Stripe account updated', {
          accountId: account.id,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled
        });
        break;
      }

      default:
        logger.info('Unhandled webhook event type', {
          type: event.type
        });
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
  } catch (error) {
    logger.error('Error processing webhook', {
      error: error.message,
      eventType: event.type,
      eventId: event.id
    });
    next(error);
  }
});

/**
 * @route   POST /api/webhooks/test
 * @desc    Test webhook endpoint (development only)
 * @access  Private
 */
router.post('/test', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not available in production' });
  }

  logger.info('Test webhook received', {
    body: req.body,
    headers: req.headers
  });

  res.json({
    success: true,
    message: 'Test webhook received',
    timestamp: new Date().toISOString()
  });
});

export default router;
