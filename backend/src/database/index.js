/**
 * Database Module
 * 
 * In-memory storage with persistence to JSON file.
 * Simple and reliable for MVP - can be upgraded to PostgreSQL later.
 * 
 * Future upgrades:
 * - Replace with PostgreSQL for production scale
 * - Add connection pooling
 * - Add replication for read scaling
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// In-memory storage
let orders = new Map();
let orderItems = new Map();
let statusHistory = new Map();
let paymentLogs = new Map();

/**
 * Ensure data directory exists
 */
const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    logger.info('Created data directory', { path: DATA_DIR });
  }
};

/**
 * Save orders to file
 */
const saveToFile = () => {
  try {
    ensureDataDir();
    const data = {
      orders: Array.from(orders.entries()),
      orderItems: Array.from(orderItems.entries()),
      statusHistory: Array.from(statusHistory.entries()),
      paymentLogs: Array.from(paymentLogs.entries()),
      lastSaved: new Date().toISOString()
    };
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    logger.error('Failed to save data:', error);
  }
};

/**
 * Load orders from file
 */
const loadFromFile = () => {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
      orders = new Map(data.orders || []);
      orderItems = new Map(data.orderItems || []);
      statusHistory = new Map(data.statusHistory || []);
      paymentLogs = new Map(data.paymentLogs || []);
      logger.info('Data loaded from file', { 
        orders: orders.size,
        lastSaved: data.lastSaved 
      });
    }
  } catch (error) {
    logger.error('Failed to load data:', error);
  }
};

/**
 * Initialize database
 */
export const initDatabase = () => {
  ensureDataDir();
  loadFromFile();
  
  // Auto-save every 30 seconds
  setInterval(saveToFile, 30000);
  
  logger.info('Database initialized');
};

/**
 * Get database instance (for compatibility)
 */
export const getDatabase = () => {
  return { status: 'connected' };
};

/**
 * Close database connection
 */
export const closeDatabase = () => {
  saveToFile();
  logger.info('Database connection closed');
};

// Order Operations

/**
 * Create a new order
 */
export const createOrder = (orderData) => {
  // Store order
  orders.set(orderData.id, {
    id: orderData.id,
    status: orderData.status,
    customer_email: orderData.customerEmail,
    customer_phone: orderData.customerPhone,
    shipping_name: orderData.shippingAddress.name,
    shipping_line1: orderData.shippingAddress.line1,
    shipping_line2: orderData.shippingAddress.line2,
    shipping_city: orderData.shippingAddress.city,
    shipping_state: orderData.shippingAddress.state,
    shipping_postal_code: orderData.shippingAddress.postalCode,
    shipping_country: orderData.shippingAddress.country || 'US',
    subtotal: orderData.pricing.subtotal,
    shipping: orderData.pricing.shipping,
    tax: orderData.pricing.tax,
    total: orderData.pricing.total,
    age_verified: orderData.compliance.ageVerified ? 1 : 0,
    age_verified_at: orderData.compliance.ageVerifiedAt,
    terms_accepted: orderData.compliance.termsAccepted ? 1 : 0,
    terms_accepted_at: orderData.compliance.termsAcceptedAt,
    research_use_only: orderData.compliance.researchUseOnly ? 1 : 0,
    research_use_acknowledged_at: orderData.compliance.researchUseAcknowledgedAt,
    ip_address: orderData.compliance.ipAddress,
    user_agent: orderData.compliance.userAgent,
    notes: orderData.notes,
    created_at: orderData.createdAt,
    updated_at: orderData.updatedAt,
  });

  // Store order items
  orderItems.set(orderData.id, orderData.items.map(item => ({
    order_id: orderData.id,
    product_id: item.productId,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    compliance_note: item.complianceNote || 'For research use only. Not for human consumption.',
  })));

  // Store initial status history
  statusHistory.set(orderData.id, [{
    order_id: orderData.id,
    status: orderData.status,
    timestamp: orderData.createdAt,
  }]);

  // Save to file
  saveToFile();

  logger.info('Order created', { orderId: orderData.id });
  return orderData.id;
};

/**
 * Get order by ID
 */
export const getOrderById = (orderId) => {
  const order = orders.get(orderId);
  if (!order) return null;

  return {
    ...order,
    items: orderItems.get(orderId) || [],
    statusHistory: statusHistory.get(orderId) || [],
  };
};

/**
 * Get orders by email
 */
export const getOrdersByEmail = (email, limit = 50, offset = 0) => {
  const allOrders = Array.from(orders.values())
    .filter(o => o.customer_email.toLowerCase() === email.toLowerCase())
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  return allOrders.slice(offset, offset + limit);
};

/**
 * Update order status
 */
export const updateOrderStatus = (orderId, status, paymentIntentId = null) => {
  const order = orders.get(orderId);
  if (!order) return false;

  order.status = status;
  order.updated_at = new Date().toISOString();
  
  if (paymentIntentId) {
    order.payment_intent_id = paymentIntentId;
  }

  // Add to status history
  const history = statusHistory.get(orderId) || [];
  history.push({
    order_id: orderId,
    status: status,
    timestamp: new Date().toISOString(),
  });
  statusHistory.set(orderId, history);

  // Save to file
  saveToFile();

  logger.info('Order status updated', { orderId, status });
  return true;
};

/**
 * List all orders (admin)
 */
export const listOrders = (filters = {}, limit = 50, offset = 0) => {
  let orderList = Array.from(orders.values());

  if (filters.status) {
    orderList = orderList.filter(o => o.status === filters.status);
  }

  if (filters.email) {
    orderList = orderList.filter(o => 
      o.customer_email.toLowerCase().includes(filters.email.toLowerCase())
    );
  }

  const total = orderList.length;
  
  orderList = orderList
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(offset, offset + limit);

  return { orders: orderList, total };
};

/**
 * Log payment event
 */
export const logPaymentEvent = (data) => {
  const logs = paymentLogs.get(data.orderId) || [];
  logs.push({
    order_id: data.orderId,
    payment_intent_id: data.paymentIntentId,
    event_type: data.eventType,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    timestamp: new Date().toISOString(),
  });
  paymentLogs.set(data.orderId, logs);

  // Save to file
  saveToFile();

  logger.info('Payment event logged', { orderId: data.orderId, eventType: data.eventType });
};

export default {
  initDatabase,
  getDatabase,
  closeDatabase,
  createOrder,
  getOrderById,
  getOrdersByEmail,
  updateOrderStatus,
  listOrders,
  logPaymentEvent,
};
