import express from 'express';
import { body, validationResult } from 'express-validator';
import stripeService from '../services/stripeService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * @route   POST /api/payments/create-intent
 * @desc    Create a payment intent for checkout
 * @access  Public
 */
router.post('/create-intent', [
  body('amount')
    .isInt({ min: 50, max: 99999999 })
    .withMessage('Amount must be between $0.50 and $999,999.99'),
  body('currency')
    .isIn(['usd', 'eur', 'gbp'])
    .withMessage('Currency must be usd, eur, or gbp'),
  body('orderId')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Valid order ID is required'),
  body('customerEmail')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  validate
], async (req, res, next) => {
  try {
    const { amount, currency = 'usd', orderId, customerEmail, metadata = {} } = req.body;

    // Add compliance metadata
    const complianceMetadata = {
      ...metadata,
      order_id: orderId,
      customer_ip: req.ip,
      user_agent: req.headers['user-agent']?.substring(0, 512) || 'unknown',
      age_verified: metadata.ageVerified === 'true' ? 'true' : 'false',
      terms_accepted: metadata.termsAccepted === 'true' ? 'true' : 'false',
      research_use_only: 'true'
    };

    const paymentIntent = await stripeService.createPaymentIntent({
      amount,
      currency,
      orderId,
      customerEmail,
      metadata: complianceMetadata
    });

    logger.info('Payment intent created', {
      paymentIntentId: paymentIntent.id,
      orderId,
      amount,
      currency
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      }
    });
  } catch (error) {
    logger.error('Failed to create payment intent', {
      error: error.message,
      orderId: req.body.orderId
    });
    next(error);
  }
});

/**
 * @route   GET /api/payments/:paymentIntentId/status
 * @desc    Get payment intent status
 * @access  Public
 */
router.get('/:paymentIntentId/status', async (req, res, next) => {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId.startsWith('pi_')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment intent ID format'
      });
    }

    const paymentIntent = await stripeService.retrievePaymentIntent(paymentIntentId);

    res.json({
      success: true,
      data: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        created: paymentIntent.created,
        charges: paymentIntent.charges.data.map(charge => ({
          id: charge.id,
          status: charge.status,
          receiptUrl: charge.receipt_url
        }))
      }
    });
  } catch (error) {
    logger.error('Failed to retrieve payment intent', {
      error: error.message,
      paymentIntentId: req.params.paymentIntentId
    });
    next(error);
  }
});

/**
 * @route   POST /api/payments/:paymentIntentId/confirm
 * @desc    Confirm a payment intent (for non-card payments)
 * @access  Public
 */
router.post('/:paymentIntentId/confirm', async (req, res, next) => {
  try {
    const { paymentIntentId } = req.params;
    const { paymentMethod } = req.body;

    const paymentIntent = await stripeService.confirmPaymentIntent(
      paymentIntentId,
      paymentMethod
    );

    res.json({
      success: true,
      data: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret
      }
    });
  } catch (error) {
    logger.error('Failed to confirm payment intent', {
      error: error.message,
      paymentIntentId: req.params.paymentIntentId
    });
    next(error);
  }
});

/**
 * @route   POST /api/payments/:paymentIntentId/refund
 * @desc    Process a refund (admin only - requires auth)
 * @access  Private
 */
router.post('/:paymentIntentId/refund', async (req, res, next) => {
  try {
    const { paymentIntentId } = req.params;
    const { amount, reason } = req.body;

    // TODO: Add admin authentication middleware
    // For now, log the attempt for audit
    logger.info('Refund requested', {
      paymentIntentId,
      amount,
      reason,
      ip: req.ip
    });

    const refund = await stripeService.createRefund({
      paymentIntentId,
      amount,
      reason: reason || 'requested_by_customer'
    });

    logger.info('Refund processed', {
      refundId: refund.id,
      paymentIntentId,
      amount: refund.amount
    });

    res.json({
      success: true,
      data: {
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status,
        reason: refund.reason
      }
    });
  } catch (error) {
    logger.error('Failed to process refund', {
      error: error.message,
      paymentIntentId: req.params.paymentIntentId
    });
    next(error);
  }
});

export default router;
