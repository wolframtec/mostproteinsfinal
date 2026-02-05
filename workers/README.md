# Most Proteins API - Cloudflare Workers

Edge-deployed backend API using Cloudflare Workers and D1 database.

## Features

- ✅ **Cloudflare Workers** - Serverless edge deployment
- ✅ **Cloudflare D1** - SQLite database at the edge
- ✅ **Stripe Integration** - Payment processing
- ✅ **Webhook Handling** - Stripe event processing
- ✅ **CORS Protection** - Configurable origins
- ✅ **Request Logging** - Structured logging
- ✅ **TypeScript** - Full type safety

## Project Structure

```
workers/
├── src/
│   ├── index.ts              # Worker entry point
│   ├── routes/
│   │   ├── health.ts         # Health check endpoints
│   │   ├── orders.ts         # Order management
│   │   ├── payments.ts       # Stripe payments
│   │   └── webhooks.ts       # Stripe webhooks
│   ├── middleware/
│   │   ├── cors.ts           # CORS handling
│   │   ├── rateLimit.ts      # Rate limiting
│   │   ├── errorHandler.ts   # Error handling
│   │   └── requestLogger.ts  # Request logging
│   ├── utils/
│   │   ├── router.ts         # Simple router
│   │   ├── helpers.ts        # Utility functions
│   │   ├── stripe.ts         # Stripe utilities
│   │   └── validators.ts     # Input validation
│   └── database/
│       └── schema.sql        # D1 database schema
├── wrangler.toml             # Worker configuration
├── package.json
└── tsconfig.json
```

## Prerequisites

- Node.js 18+
- Cloudflare account
- Stripe account

## Setup

### 1. Install Dependencies

```bash
cd workers
npm install
```

### 2. Create D1 Database

```bash
npx wrangler d1 create mostproteins-db
```

Copy the `database_id` from the output and paste it into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "mostproteins-db"
database_id = "your-database-id-here"  # <-- Replace this
```

### 3. Run Migrations

```bash
npx wrangler d1 execute mostproteins-db --file=./src/database/schema.sql
```

### 4. Set Secrets

```bash
# Stripe Secret Key (get from Stripe Dashboard)
npx wrangler secret put STRIPE_SECRET_KEY
# Enter: sk_live_...

# Stripe Webhook Secret (get from Stripe Dashboard after setting up webhook)
npx wrangler secret put STRIPE_WEBHOOK_SECRET
# Enter: whsec_...
```

### 5. Configure Allowed Origins (Optional)

Update `wrangler.toml` with your frontend domains:

```toml
[vars]
ALLOWED_ORIGINS = "https://mostproteins.com,https://www.mostproteins.com,https://*.pages.dev"
```

## Development

### Local Development

```bash
npm run dev
```

The worker will run on `http://localhost:8787`

### Test Endpoints

```bash
# Health check
curl http://localhost:8787/api/health

# Create order
curl -X POST http://localhost:8787/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "1", "name": "Test Product", "quantity": 1, "price": 1000}],
    "shippingAddress": {"name": "Test", "line1": "123 Main St", "city": "NYC", "state": "NY", "postalCode": "10001"},
    "customerEmail": "test@example.com",
    "ageVerified": true,
    "termsAccepted": true,
    "researchUseOnly": true,
    "pricing": {"subtotal": 1000, "shipping": 0, "tax": 0, "total": 1000},
    "compliance": {"ageVerified": true, "termsAccepted": true, "researchUseOnly": true}
  }'
```

## Deployment

### Deploy to Cloudflare

```bash
npm run deploy
```

### Configure Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your Worker URL: `https://mostproteins-api.YOUR_SUBDOMAIN.workers.dev/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
5. Save and copy the **Signing secret**
6. Update the secret: `npx wrangler secret put STRIPE_WEBHOOK_SECRET`

### Update Frontend

Update your frontend `.env`:

```bash
VITE_API_URL=https://mostproteins-api.YOUR_SUBDOMAIN.workers.dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/:id` | Get order by ID |
| GET | `/api/orders?email=xxx` | Get orders by email |
| PATCH | `/api/orders/:id/status` | Update order status |
| POST | `/api/payments/create-intent` | Create payment intent |
| GET | `/api/payments/:id/status` | Get payment status |
| GET | `/api/payments/order/:orderId` | Get order payment details |
| POST | `/api/webhooks/stripe` | Stripe webhook handler |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | ✅ Yes | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | ✅ Yes | Stripe webhook signing secret |
| `ALLOWED_ORIGINS` | No | Comma-separated list of allowed CORS origins |
| `NODE_ENV` | No | `development` or `production` |

## Database Schema

The D1 database includes:
- `orders` - Order information
- `order_items` - Line items
- `order_status_history` - Status change log
- `payment_audit_log` - Payment event log

## Monitoring

### View Logs

```bash
npx wrangler tail
```

### Cloudflare Dashboard

- **Analytics:** Workers & Pages → Your Worker → Analytics
- **Logs:** Workers & Pages → Your Worker → Logs
- **Database:** Workers & Pages → D1 → Your Database

## Troubleshooting

### "Database not found"
- Ensure `database_id` is set correctly in `wrangler.toml`
- Run migrations: `npm run db:migrate`

### "Stripe key not configured"
- Set the secret: `npx wrangler secret put STRIPE_SECRET_KEY`
- Verify in Cloudflare Dashboard → Your Worker → Variables

### CORS errors
- Add your frontend domain to `ALLOWED_ORIGINS`
- Check that the Worker is deployed: `npm run deploy`

### Webhook signature invalid
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Ensure webhook URL is correct
- Check that request body isn't being modified

## Cost

| Resource | Free Tier | Paid Tier |
|----------|-----------|-----------|
| Workers | 100,000 requests/day | $0.30/million requests |
| D1 | 5M rows read/day | $1.00/million rows read |
| D1 Storage | 500MB | $0.25/GB-month |

## License

Private - Most Proteins
