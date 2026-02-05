-- Most Proteins Database Schema for Cloudflare D1
-- Run with: wrangler d1 execute mostproteins-db --file=./src/database/schema.sql

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending',
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_name TEXT NOT NULL,
  shipping_line1 TEXT NOT NULL,
  shipping_line2 TEXT,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT DEFAULT 'US',
  subtotal INTEGER NOT NULL,  -- stored in cents
  shipping_cost INTEGER NOT NULL DEFAULT 0,  -- stored in cents
  tax INTEGER NOT NULL DEFAULT 0,  -- stored in cents
  total INTEGER NOT NULL,  -- stored in cents
  payment_intent_id TEXT,
  age_verified INTEGER NOT NULL DEFAULT 0,
  age_verified_at TEXT,
  terms_accepted INTEGER NOT NULL DEFAULT 0,
  terms_accepted_at TEXT,
  research_use_only INTEGER NOT NULL DEFAULT 1,
  research_use_acknowledged_at TEXT,
  ip_address TEXT,
  user_agent TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price INTEGER NOT NULL,  -- stored in cents
  compliance_note TEXT DEFAULT 'For research use only. Not for human consumption.',
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Order status history table
CREATE TABLE IF NOT EXISTS order_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Payment audit log table
CREATE TABLE IF NOT EXISTS payment_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  payment_intent_id TEXT,
  event_type TEXT NOT NULL,
  amount INTEGER,
  currency TEXT,
  status TEXT,
  metadata TEXT,  -- JSON string
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON orders(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_status_history_order ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_log_order ON payment_audit_log(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_log_intent ON payment_audit_log(payment_intent_id);
