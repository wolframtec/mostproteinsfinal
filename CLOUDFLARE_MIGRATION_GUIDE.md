# Cloudflare Deployment Migration Guide

## Executive Summary

Deploying on Cloudflare requires **significant architectural changes** because the current backend is built for Node.js/Express, while Cloudflare uses a different runtime environment (V8 isolates). This guide outlines three deployment strategies, with **Option B (Workers + D1)** being the recommended approach.

---

## Current Architecture Issues for Cloudflare

| Component | Current Implementation | Cloudflare Compatibility |
|-----------|----------------------|-------------------------|
| **Runtime** | Node.js 18+ Express | ❌ Not compatible - needs Workers |
| **Database** | File-system JSON storage | ❌ Ephemeral - needs D1 or external DB |
| **File System** | `fs` module for logs/data | ❌ Not available in Workers |
| **Process** | Long-running server process | ❌ Workers are stateless/request-based |
| **Stripe SDK** | Node.js Stripe SDK | ⚠️ Needs Stripe.js for Workers |

---

## Deployment Options

### Option A: Hybrid (Easiest - Recommended for Quick Launch)
**Frontend:** Cloudflare Pages  
**Backend:** Keep on Railway/Render (Node.js)

**Pros:**
- Minimal code changes
- Backend works as-is
- Fastest to deploy

**Cons:**
- Two different platforms to manage
- Slightly higher latency

**Effort:** 1-2 hours

---

### Option B: Full Cloudflare (Recommended for Scale)
**Frontend:** Cloudflare Pages  
**Backend:** Cloudflare Workers  
**Database:** Cloudflare D1 (SQLite)

**Pros:**
- Single platform
- Edge deployment (low latency worldwide)
- Scales automatically
- Cost-effective at scale

**Cons:**
- Requires code refactoring
- Learning curve for Workers API
- Some Node.js packages incompatible

**Effort:** 2-3 days

---

### Option C: Pages Functions (Middle Ground)
**Frontend:** Cloudflare Pages  
**Backend:** Cloudflare Pages Functions (serverless)

**Pros:**
- Unified deployment
- Good for simple APIs

**Cons:**
- Limited execution time (30s)
- Cold start latency
- Not ideal for complex payment flows

**Effort:** 1 day

---

## Recommended: Option B - Full Cloudflare Stack

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Cloudflare                             │
│  ┌─────────────────┐      ┌──────────────────────────┐     │
│  │  Cloudflare     │      │   Cloudflare Workers     │     │
│  │  Pages          │◄────►│   (Backend API)          │     │
│  │  (Frontend)     │      │                          │     │
│  └─────────────────┘      └───────────┬──────────────┘     │
│                                       │                     │
│                              ┌────────▼────────┐           │
│                              │  Cloudflare D1  │           │
│                              │  (Database)     │           │
│                              └─────────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Stripe API     │
                    └──────────────────┘
```

---

## Phase 1: Frontend Migration (Cloudflare Pages)

### Step 1: Create wrangler.toml
Create `app/wrangler.toml`:

```toml
name = "mostproteins"
compatibility_date = "2024-01-01"

[build]
command = "npm run build"
output_dir = "dist"

[env.production]
vars = { VITE_API_URL = "https://api.mostproteins.com" }

[env.staging]
vars = { VITE_API_URL = "https://api-staging.mostproteins.com" }
```

### Step 2: Update Frontend API Client

File: `app/src/services/api.ts`

Update to handle Cloudflare Workers response format:

```typescript
// Update base URL for production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

// Add error handling for Workers-specific errors
export const createOrder = async (orderData: OrderData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create order');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
```

### Step 3: Deploy Frontend

```bash
cd app
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy dist --project-name=mostproteins
```

---

## Phase 2: Backend Migration (Cloudflare Workers + D1)

### Step 1: Create Workers Project Structure

Create new directory `workers/`:

```
workers/
├── src/
│   ├── index.ts           # Worker entry point
│   ├── routes/
│   │   ├── orders.ts      # Order handlers
│   │   ├── payments.ts    # Payment handlers
│   │   ├── webhooks.ts    # Stripe webhooks
│   │   └── health.ts      # Health check
│   ├── database/
│   │   └── schema.sql     # D1 database schema
│   └── utils/
│       ├── logger.ts      # Structured logging
│       └── validators.ts  # Input validation
├── wrangler.toml          # Worker config
├── package.json
└── tsconfig.json
```

### Step 2: Create wrangler.toml for Workers

File: `workers/wrangler.toml`

```toml
name = "mostproteins-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# D1 Database binding
[[d1_databases]]
binding = "DB"
database_name = "mostproteins-db"
database_id = "your-database-id-here"

# Environment variables
[vars]
NODE_ENV = "production"

# Secrets (set via wrangler secret put)
# STRIPE_SECRET_KEY
# STRIPE_WEBHOOK_SECRET

# Rate limiting config
[limits]
cpu_ms = 50000  # 50s CPU time limit
```

### Step 3: Create D1 Database Schema

File: `workers/src/database/schema.sql`

```sql
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
  subtotal INTEGER NOT NULL,  -- cents
  shipping INTEGER NOT NULL,  -- cents
  tax INTEGER NOT NULL,       -- cents
  total INTEGER NOT NULL,     -- cents
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
  price INTEGER NOT NULL,  -- cents
  compliance_note TEXT DEFAULT 'For research use only. Not for human consumption.',
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Status history table
CREATE TABLE IF NOT EXISTS order_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  status TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Payment audit log
CREATE TABLE IF NOT EXISTS payment_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  payment_intent_id TEXT,
  event_type TEXT NOT NULL,
  amount INTEGER,
  currency TEXT,
  status TEXT,
  metadata TEXT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_status_history_order ON order_status_history(order_id);
```

### Step 4: Create Worker Entry Point

File: `workers/src/index.ts`

```typescript
/**
 * Most Proteins API - Cloudflare Worker
 * 
 * Edge-deployed backend for payment processing and order management.
 * Uses Cloudflare D1 for database and Stripe for payments.
 */

import { Router } from './router';
import { handleCORS } from './middleware/cors';
import { rateLimit } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payments';
import webhookRoutes from './routes/webhooks';
import healthRoutes from './routes/health';

// Environment variables type
export interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  ALLOWED_ORIGINS: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    const corsResponse = handleCORS(request, env);
    if (corsResponse) return corsResponse;
    
    // Create router
    const router = new Router();
    
    // Apply middleware
    router.use(rateLimit);
    
    // Register routes
    router.use('/api/health', healthRoutes);
    router.use('/api/orders', orderRoutes);
    router.use('/api/payments', paymentRoutes);
    router.use('/api/webhooks', webhookRoutes);
    
    // Handle request
    try {
      const response = await router.handle(request, env, ctx);
      
      // Add CORS headers to response
      return addCORSHeaders(response, request, env);
    } catch (error) {
      return errorHandler(error, request);
    }
  },
};
```

### Step 5: Create Order Routes for Workers

File: `workers/src/routes/orders.ts`

```typescript
import { Router } from '../router';
import { validateOrder } from '../utils/validators';
import { generateOrderId } from '../utils/helpers';

const router = new Router();

// Create order
router.post('/', async (request, env, ctx) => {
  const data = await request.json();
  
  // Validate input
  const validation = validateOrder(data);
  if (!validation.valid) {
    return new Response(JSON.stringify({ error: validation.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const orderId = generateOrderId();
  const now = new Date().toISOString();
  
  // Insert order into D1
  const { success } = await env.DB.prepare(`
    INSERT INTO orders (
      id, status, customer_email, customer_phone,
      shipping_name, shipping_line1, shipping_line2,
      shipping_city, shipping_state, shipping_postal_code, shipping_country,
      subtotal, shipping, tax, total,
      age_verified, age_verified_at, terms_accepted, terms_accepted_at,
      research_use_only, research_use_acknowledged_at,
      ip_address, user_agent, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    orderId,
    'pending',
    data.customerEmail,
    data.customerPhone || null,
    data.shippingAddress.name,
    data.shippingAddress.line1,
    data.shippingAddress.line2 || null,
    data.shippingAddress.city,
    data.shippingAddress.state,
    data.shippingAddress.postalCode,
    data.shippingAddress.country || 'US',
    data.pricing.subtotal,
    data.pricing.shipping,
    data.pricing.tax,
    data.pricing.total,
    data.compliance.ageVerified ? 1 : 0,
    data.compliance.ageVerifiedAt,
    data.compliance.termsAccepted ? 1 : 0,
    data.compliance.termsAcceptedAt,
    data.compliance.researchUseOnly ? 1 : 0,
    data.compliance.researchUseAcknowledgedAt,
    data.compliance.ipAddress,
    data.compliance.userAgent,
    now,
    now
  ).run();
  
  if (!success) {
    return new Response(JSON.stringify({ error: 'Failed to create order' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // Insert order items
  for (const item of data.items) {
    await env.DB.prepare(`
      INSERT INTO order_items (order_id, product_id, name, quantity, price, compliance_note)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(orderId, item.productId, item.name, item.quantity, item.price, item.complianceNote || 'For research use only.').run();
  }
  
  // Insert initial status history
  await env.DB.prepare(`
    INSERT INTO order_status_history (order_id, status, timestamp)
    VALUES (?, ?, ?)
  `).bind(orderId, 'pending', now).run();
  
  return new Response(JSON.stringify({ 
    success: true, 
    orderId,
    status: 'pending'
  }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
});

// Get order by ID
router.get('/:id', async (request, env, ctx) => {
  const url = new URL(request.url);
  const orderId = url.pathname.split('/').pop();
  
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
  const items = await env.DB.prepare(`
    SELECT * FROM order_items WHERE order_id = ?
  `).bind(orderId).all();
  
  // Get status history
  const history = await env.DB.prepare(`
    SELECT * FROM order_status_history WHERE order_id = ? ORDER BY timestamp DESC
  `).bind(orderId).all();
  
  return new Response(JSON.stringify({
    ...order,
    items: items.results,
    statusHistory: history.results,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

export default router;
```

### Step 6: Create Payment Routes with Stripe

File: `workers/src/routes/payments.ts`

```typescript
import { Router } from '../router';

const router = new Router();

// Create payment intent
router.post('/create-intent', async (request, env, ctx) => {
  const { amount, currency = 'usd', orderId, customerEmail } = await request.json();
  
  // Validate amount
  if (!amount || amount < 50) { // Minimum 50 cents
    return new Response(JSON.stringify({ error: 'Invalid amount' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  try {
    // Call Stripe API
    const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: amount.toString(),
        currency: currency.toLowerCase(),
        'metadata[order_id]': orderId,
        'receipt_email': customerEmail,
        automatic_payment_methods: JSON.stringify({ enabled: true }),
      }),
    });
    
    if (!stripeResponse.ok) {
      const error = await stripeResponse.json();
      throw new Error(error.error?.message || 'Stripe API error');
    }
    
    const paymentIntent = await stripeResponse.json();
    
    // Update order with payment intent ID
    await env.DB.prepare(`
      UPDATE orders SET payment_intent_id = ?, updated_at = ? WHERE id = ?
    `).bind(paymentIntent.id, new Date().toISOString(), orderId).run();
    
    // Log payment event
    await env.DB.prepare(`
      INSERT INTO payment_audit_log (order_id, payment_intent_id, event_type, amount, currency, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(orderId, paymentIntent.id, 'payment_intent.created', amount, currency, paymentIntent.status).run();
    
    return new Response(JSON.stringify({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Payment creation failed',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// Get payment status
router.get('/:id/status', async (request, env, ctx) => {
  const url = new URL(request.url);
  const paymentIntentId = url.pathname.split('/').pop();
  
  try {
    const stripeResponse = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      },
    });
    
    const paymentIntent = await stripeResponse.json();
    
    return new Response(JSON.stringify({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch payment status' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

export default router;
```

### Step 7: Create Stripe Webhook Handler

File: `workers/src/routes/webhooks.ts`

```typescript
import { Router } from '../router';
import { verifyStripeSignature } from '../utils/stripe';

const router = new Router();

// Stripe webhook endpoint
router.post('/stripe', async (request, env, ctx) => {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');
  
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }
  
  // Verify webhook signature
  const isValid = await verifyStripeSignature(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  if (!isValid) {
    return new Response('Invalid signature', { status: 400 });
  }
  
  const event = JSON.parse(payload);
  
  // Handle events
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object, env);
      break;
      
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object, env);
      break;
      
    case 'charge.refunded':
      await handleRefund(event.data.object, env);
      break;
  }
  
  return new Response('Webhook received', { status: 200 });
});

async function handlePaymentSuccess(paymentIntent: any, env: Env) {
  const orderId = paymentIntent.metadata?.order_id;
  if (!orderId) return;
  
  // Update order status
  await env.DB.prepare(`
    UPDATE orders SET status = 'paid', updated_at = ? WHERE id = ?
  `).bind(new Date().toISOString(), orderId).run();
  
  // Add status history
  await env.DB.prepare(`
    INSERT INTO order_status_history (order_id, status, timestamp)
    VALUES (?, ?, ?)
  `).bind(orderId, 'paid', new Date().toISOString()).run();
  
  // Log payment event
  await env.DB.prepare(`
    INSERT INTO payment_audit_log (order_id, payment_intent_id, event_type, amount, currency, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(orderId, paymentIntent.id, 'payment_intent.succeeded', paymentIntent.amount, paymentIntent.currency, 'succeeded').run();
}

async function handlePaymentFailure(paymentIntent: any, env: Env) {
  const orderId = paymentIntent.metadata?.order_id;
  if (!orderId) return;
  
  await env.DB.prepare(`
    UPDATE orders SET status = 'payment_failed', updated_at = ? WHERE id = ?
  `).bind(new Date().toISOString(), orderId).run();
}

async function handleRefund(charge: any, env: Env) {
  // Handle refund logic
}

export default router;
```

### Step 8: Setup Commands

Create `workers/package.json`:

```json
{
  "name": "mostproteins-api",
  "version": "2.0.0",
  "description": "Cloudflare Worker backend for Most Proteins",
  "main": "src/index.ts",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "db:create": "wrangler d1 create mostproteins-db",
    "db:migrate": "wrangler d1 execute mostproteins-db --file=./src/database/schema.sql"
  },
  "dependencies": {
    "stripe": "^14.10.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20231218.0",
    "typescript": "^5.3.3",
    "wrangler": "^3.22.1"
  }
}
```

### Step 9: Deployment Commands

```bash
cd workers

# 1. Install dependencies
npm install

# 2. Create D1 database (run once)
npx wrangler d1 create mostproteins-db
# Copy the database_id from output to wrangler.toml

# 3. Run migrations
npx wrangler d1 execute mostproteins-db --file=./src/database/schema.sql

# 4. Set secrets
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET

# 5. Deploy
npx wrangler deploy
```

---

## Phase 3: Testing & Verification

### Pre-Deployment Checklist

- [ ] D1 database created and migrated
- [ ] Stripe keys added as secrets
- [ ] CORS origins configured correctly
- [ ] Frontend API URL updated
- [ ] Webhook endpoint configured in Stripe dashboard

### Post-Deployment Tests

```bash
# Test health endpoint
curl https://mostproteins-api.your-subdomain.workers.dev/api/health

# Test order creation
curl -X POST https://mostproteins-api.your-subdomain.workers.dev/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "1", "name": "Test Product", "quantity": 1, "price": 1000}],
    "shippingAddress": {"name": "Test User", "line1": "123 Main St", "city": "NYC", "state": "NY", "postalCode": "10001"},
    "customerEmail": "test@example.com",
    "ageVerified": true,
    "termsAccepted": true,
    "researchUseOnly": true,
    "pricing": {"subtotal": 1000, "shipping": 0, "tax": 0, "total": 1000},
    "compliance": {"ageVerified": true, "termsAccepted": true, "researchUseOnly": true}
  }'

# Test payment intent
curl -X POST https://mostproteins-api.your-subdomain.workers.dev/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "currency": "usd", "orderId": "TEST-123"}'
```

---

## Cost Comparison

| Service | Railway | Cloudflare Workers + D1 |
|---------|---------|------------------------|
| **Compute** | $5-20/month | Free tier: 100k req/day |
| **Database** | Included | Free tier: 5M rows |
| **Bandwidth** | $0.10/GB | Unlimited (free) |
| **Estimated Monthly** | $20-50 | $0-5 (free tier) |

---

## Rollback Plan

If issues arise:

1. **Immediate:** Switch frontend API URL back to Railway backend
2. **Debug:** Check Cloudflare Worker logs with `wrangler tail`
3. **Database:** Export D1 data and import to SQLite if reverting

---

## Summary of Changes Required

### Files to Create:
- `app/wrangler.toml` - Frontend deployment config
- `workers/` - Entire new backend directory
- `workers/wrangler.toml` - Worker config
- `workers/src/database/schema.sql` - D1 schema
- `workers/src/index.ts` - Worker entry
- `workers/src/routes/*.ts` - API routes

### Files to Modify:
- `app/src/services/api.ts` - Update API base URL
- `app/.env` - Add production API URL
- `backend/` - Keep as backup/fallback

### Estimated Timeline:
- **Day 1:** Set up Workers project, create D1 schema
- **Day 2:** Migrate routes, test locally
- **Day 3:** Deploy, configure webhooks, test end-to-end

---

## Master Checklist

Use this as your working checklist:

```markdown
## Cloudflare Migration Checklist

### Phase 1: Setup
- [ ] Create Cloudflare account
- [ ] Install Wrangler CLI: `npm install -g wrangler`
- [ ] Login: `wrangler login`
- [ ] Create D1 database
- [ ] Update wrangler.toml with database_id

### Phase 2: Backend (Workers)
- [ ] Create workers/ directory structure
- [ ] Copy schema.sql and run migration
- [ ] Implement index.ts entry point
- [ ] Implement order routes
- [ ] Implement payment routes
- [ ] Implement webhook handler
- [ ] Set STRIPE_SECRET_KEY secret
- [ ] Set STRIPE_WEBHOOK_SECRET secret
- [ ] Deploy worker: `wrangler deploy`
- [ ] Test health endpoint

### Phase 3: Frontend (Pages)
- [ ] Create app/wrangler.toml
- [ ] Update API base URL in services/api.ts
- [ ] Build: `npm run build`
- [ ] Deploy: `wrangler pages deploy dist`
- [ ] Verify frontend loads

### Phase 4: Integration
- [ ] Configure Stripe webhook endpoint
- [ ] Update ALLOWED_ORIGINS in worker
- [ ] Test complete checkout flow
- [ ] Verify order creation in D1
- [ ] Verify payment processing
- [ ] Check webhook handling

### Phase 5: Cleanup
- [ ] Monitor for 48 hours
- [ ] Update documentation
- [ ] Archive old backend (optional)
```

---

**Next Step:** Decide which option you want to pursue:
- **Option A (Hybrid):** Fastest, minimal changes
- **Option B (Full Cloudflare):** Best long-term, requires the migration above
- **Option C (Pages Functions):** Middle ground

Once you decide, I can help implement the specific changes.
