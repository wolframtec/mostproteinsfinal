/**
 * Order management routes
 */

import { Router } from '../utils/router';
import { Env } from '../index';
import { validateOrder, sanitizeOrderInput } from '../utils/validators';
import { generateOrderId, getClientIP, getUserAgent, formatDate } from '../utils/helpers';
import { logInfo, logError } from '../middleware/requestLogger';

const router = new Router();

// Create new order
router.post('/', async (request, env, ctx) => {
  try {
    const data = await request.json() as Record<string, unknown>;
    
    // Validate input
    const validation = validateOrder(data);
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
    
    // Sanitize input
    const sanitized = sanitizeOrderInput(data);
    
    const orderId = generateOrderId();
    const now = formatDate();
    const ipAddress = getClientIP(request);
    const userAgent = getUserAgent(request);
    
    const shippingAddress = sanitized.shippingAddress as Record<string, string>;
    const pricing = sanitized.pricing as Record<string, number>;
    const compliance = sanitized.compliance as Record<string, boolean>;
    
    // Insert order into D1
    const orderResult = await env.DB.prepare(`
      INSERT INTO orders (
        id, status, customer_email, customer_phone,
        shipping_name, shipping_line1, shipping_line2,
        shipping_city, shipping_state, shipping_postal_code, shipping_country,
        subtotal, shipping_cost, tax, total,
        age_verified, age_verified_at, terms_accepted, terms_accepted_at,
        research_use_only, research_use_acknowledged_at,
        ip_address, user_agent, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderId,
      'pending',
      sanitized.customerEmail,
      sanitized.customerPhone,
      shippingAddress.name,
      shippingAddress.line1,
      shippingAddress.line2,
      shippingAddress.city,
      shippingAddress.state,
      shippingAddress.postalCode,
      shippingAddress.country,
      pricing.subtotal,
      pricing.shipping || 0,
      pricing.tax || 0,
      pricing.total,
      compliance.ageVerified ? 1 : 0,
      compliance.ageVerifiedAt || now,
      compliance.termsAccepted ? 1 : 0,
      compliance.termsAcceptedAt || now,
      compliance.researchUseOnly ? 1 : 0,
      compliance.researchUseAcknowledgedAt || now,
      ipAddress,
      userAgent,
      now,
      now
    ).run();
    
    if (!orderResult.success) {
      throw new Error('Failed to insert order');
    }
    
    // Insert order items
    const items = sanitized.items as Array<Record<string, unknown>>;
    for (const item of items) {
      await env.DB.prepare(`
        INSERT INTO order_items (order_id, product_id, name, quantity, price, compliance_note)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        orderId,
        item.productId,
        item.name,
        item.quantity,
        item.price,
        item.complianceNote || 'For research use only. Not for human consumption.'
      ).run();
    }
    
    // Insert initial status history
    await env.DB.prepare(`
      INSERT INTO order_status_history (order_id, status, timestamp)
      VALUES (?, ?, ?)
    `).bind(orderId, 'pending', now).run();
    
    logInfo('Order created', { orderId, email: sanitized.customerEmail });
    
    return new Response(JSON.stringify({
      success: true,
      orderId,
      status: 'pending',
      total: pricing.total,
      currency: 'usd',
      createdAt: now,
      message: 'Order created successfully',
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    logError('Failed to create order', error);
    return new Response(JSON.stringify({
      error: 'Failed to create order',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// Get order by ID
router.get('/:id', async (request, env, ctx, params) => {
  try {
    const orderId = params?.id;
    
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Order ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Get order
    const order = await env.DB.prepare(`
      SELECT * FROM orders WHERE id = ?
    `).bind(orderId).first();
    
    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Get order items
    const itemsResult = await env.DB.prepare(`
      SELECT * FROM order_items WHERE order_id = ?
    `).bind(orderId).all();
    
    // Get status history
    const historyResult = await env.DB.prepare(`
      SELECT * FROM order_status_history WHERE order_id = ? ORDER BY timestamp DESC
    `).bind(orderId).all();
    
    const response = {
      order: {
        ...order,
        age_verified: Boolean(order.age_verified),
        terms_accepted: Boolean(order.terms_accepted),
        research_use_only: Boolean(order.research_use_only),
      },
      items: itemsResult.results || [],
      statusHistory: historyResult.results || [],
    };
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    logError('Failed to get order', error, { orderId: params?.id });
    return new Response(JSON.stringify({
      error: 'Failed to retrieve order',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// Get orders by email
router.get('/', async (request, env, ctx) => {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email parameter required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Get orders by email
    const ordersResult = await env.DB.prepare(`
      SELECT * FROM orders 
      WHERE customer_email = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(email.toLowerCase(), limit, offset).all();
    
    // Get total count
    const countResult = await env.DB.prepare(`
      SELECT COUNT(*) as total FROM orders WHERE customer_email = ?
    `).bind(email.toLowerCase()).first();
    
    return new Response(JSON.stringify({
      orders: ordersResult.results || [],
      total: countResult?.total || 0,
      limit,
      offset,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    logError('Failed to list orders', error);
    return new Response(JSON.stringify({
      error: 'Failed to retrieve orders',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// Update order status (for admin/webhook use)
router.patch('/:id/status', async (request, env, ctx, params) => {
  try {
    const orderId = params?.id;
    const data = await request.json() as Record<string, string>;
    const { status, notes } = data;
    
    if (!orderId || !status) {
      return new Response(JSON.stringify({ error: 'Order ID and status required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const now = formatDate();
    
    // Update order
    await env.DB.prepare(`
      UPDATE orders SET status = ?, updated_at = ? WHERE id = ?
    `).bind(status, now, orderId).run();
    
    // Add status history
    await env.DB.prepare(`
      INSERT INTO order_status_history (order_id, status, notes, timestamp)
      VALUES (?, ?, ?, ?)
    `).bind(orderId, status, notes || null, now).run();
    
    logInfo('Order status updated', { orderId, status });
    
    return new Response(JSON.stringify({
      success: true,
      orderId,
      status,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    logError('Failed to update order status', error);
    return new Response(JSON.stringify({
      error: 'Failed to update order status',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

export default router;
