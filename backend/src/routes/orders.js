import express from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import { createOrder, getOrderById, updateOrderStatus, listOrders } from '../database/index.js';

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
 * Generate unique order ID
 */
const generateOrderId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Public
 */
router.post('/', [
  body('items')
    .isArray({ min: 1, max: 100 })
    .withMessage('Order must contain 1-100 items'),
  body('items.*.productId')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Valid product ID is required for each item'),
  body('items.*.name')
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Product name is required'),
  body('items.*.quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100'),
  body('items.*.price')
    .isInt({ min: 1 })
    .withMessage('Valid price is required'),
  body('shippingAddress')
    .isObject()
    .withMessage('Shipping address is required'),
  body('shippingAddress.name')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Recipient name is required'),
  body('shippingAddress.line1')
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Address line 1 is required'),
  body('shippingAddress.city')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('City is required'),
  body('shippingAddress.state')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('State is required'),
  body('shippingAddress.postalCode')
    .isString()
    .trim()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Valid US postal code is required'),
  body('shippingAddress.country')
    .optional()
    .isIn(['US'])
    .withMessage('Only US shipping is currently supported'),
  body('customerEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('customerPhone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
  body('ageVerified')
    .isBoolean()
    .withMessage('Age verification is required'),
  body('termsAccepted')
    .isBoolean()
    .withMessage('Terms acceptance is required'),
  body('researchUseOnly')
    .isBoolean()
    .withMessage('Research use acknowledgment is required'),
  validate
], async (req, res, next) => {
  try {
    const {
      items,
      shippingAddress,
      customerEmail,
      customerPhone,
      ageVerified,
      termsAccepted,
      researchUseOnly,
      notes
    } = req.body;

    // Validate age verification
    if (!ageVerified) {
      return res.status(400).json({
        success: false,
        error: 'Age verification required',
        message: 'You must be 21 or older to purchase research peptides'
      });
    }

    // Validate terms acceptance
    if (!termsAccepted) {
      return res.status(400).json({
        success: false,
        error: 'Terms acceptance required',
        message: 'You must accept the Terms of Service and Privacy Policy'
      });
    }

    // Validate research use acknowledgment
    if (!researchUseOnly) {
      return res.status(400).json({
        success: false,
        error: 'Research use acknowledgment required',
        message: 'You must acknowledge these products are for research use only'
      });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal >= 10000 ? 0 : 995; // Free shipping over $100
    const tax = Math.round(subtotal * 0.08); // 8% tax (simplified)
    const total = subtotal + shipping + tax;

    const orderId = generateOrderId();
    const now = new Date().toISOString();
    
    const order = {
      id: orderId,
      status: 'pending_payment',
      items: items.map(item => ({
        ...item,
        complianceNote: 'For research use only. Not for human consumption.'
      })),
      shippingAddress,
      customerEmail,
      customerPhone: customerPhone || null,
      pricing: {
        subtotal,
        shipping,
        tax,
        total
      },
      compliance: {
        ageVerified,
        ageVerifiedAt: now,
        termsAccepted,
        termsAcceptedAt: now,
        researchUseOnly,
        researchUseAcknowledgedAt: now,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']?.substring(0, 512) || 'unknown'
      },
      notes: notes || null,
      createdAt: now,
      updatedAt: now
    };

    // Store order in database
    createOrder(order);

    logger.info('Order created', {
      orderId,
      customerEmail,
      total,
      itemCount: items.length
    });

    res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        status: order.status,
        total: order.pricing.total,
        currency: 'usd',
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    logger.error('Failed to create order', {
      error: error.message,
      customerEmail: req.body.customerEmail
    });
    next(error);
  }
});

/**
 * @route   GET /api/orders/:orderId
 * @desc    Get order details
 * @access  Public (with email verification)
 */
router.get('/:orderId', async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { email } = req.query;

    const order = getOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Verify email matches for security
    if (email && email.toLowerCase() !== order.customer_email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Return sanitized order data
    res.json({
      success: true,
      data: {
        orderId: order.id,
        status: order.status,
        items: order.items.map(item => ({
          productId: item.product_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          complianceNote: item.compliance_note
        })),
        pricing: {
          subtotal: order.subtotal,
          shipping: order.shipping,
          tax: order.tax,
          total: order.total
        },
        shippingAddress: {
          name: order.shipping_name,
          line1: order.shipping_line1,
          line2: order.shipping_line2,
          city: order.shipping_city,
          state: order.shipping_state,
          postalCode: order.shipping_postal_code,
          country: order.shipping_country || 'US'
        },
        customerEmail: order.customer_email,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        compliance: {
          ageVerified: Boolean(order.age_verified),
          termsAccepted: Boolean(order.terms_accepted),
          researchUseOnly: Boolean(order.research_use_only)
        }
      }
    });
  } catch (error) {
    logger.error('Failed to retrieve order', {
      error: error.message,
      orderId: req.params.orderId
    });
    next(error);
  }
});

/**
 * @route   PATCH /api/orders/:orderId/status
 * @desc    Update order status (webhook/internal use)
 * @access  Private
 */
router.patch('/:orderId/status', async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, paymentIntentId } = req.body;

    const validStatuses = ['pending_payment', 'payment_processing', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const order = getOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    updateOrderStatus(orderId, status, paymentIntentId);

    logger.info('Order status updated', {
      orderId,
      status,
      paymentIntentId
    });

    res.json({
      success: true,
      data: {
        orderId,
        status,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to update order status', {
      error: error.message,
      orderId: req.params.orderId
    });
    next(error);
  }
});

/**
 * @route   GET /api/orders
 * @desc    List all orders (admin only)
 * @access  Private
 */
router.get('/', async (req, res, next) => {
  try {
    // TODO: Add admin authentication
    const { status, email, limit = 50, offset = 0 } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (email) filters.email = email;

    const { orders, total } = listOrders(filters, parseInt(limit), parseInt(offset));

    res.json({
      success: true,
      data: {
        orders: orders.map(o => ({
          orderId: o.id,
          status: o.status,
          customerEmail: o.customer_email,
          total: o.total,
          createdAt: o.created_at
        })),
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });
  } catch (error) {
    logger.error('Failed to list orders', {
      error: error.message
    });
    next(error);
  }
});

export default router;
