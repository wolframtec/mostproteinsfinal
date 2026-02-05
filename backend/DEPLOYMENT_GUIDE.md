# Backend Deployment Guide

## What's Been Built

### Complete Backend Features:
- ✅ **Express.js API** with ES modules
- ✅ **SQLite Database** for order persistence
- ✅ **Stripe Integration** for payment processing
- ✅ **Webhook Handling** with signature verification
- ✅ **Security Middleware** (Helmet, CORS, Rate Limiting, HPP)
- ✅ **Input Validation** with express-validator
- ✅ **Winston Logging** with structured logs
- ✅ **Health Check Endpoints** for monitoring
- ✅ **Email Service** (SendGrid) for notifications

### API Endpoints:
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id/status` - Update order status
- `POST /api/payments/create-intent` - Create payment intent
- `GET /api/payments/:id/status` - Get payment status
- `POST /api/webhooks/stripe` - Stripe webhook handler
- `GET /api/health` - Health check

## Deployment Options

### Option 1: Railway (Recommended - Free Tier)

1. **Push to GitHub:**
```bash
cd /mnt/okcomputer/output/backend
git init
git add .
git commit -m "Initial backend commit"
# Create GitHub repo and push
```

2. **Deploy on Railway:**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your backend repo
   - Railway will auto-detect Node.js and deploy

3. **Add Environment Variables:**
   - In Railway dashboard, go to Variables
   - Add:
     - `STRIPE_SECRET_KEY` = your_stripe_secret_key
     - `STRIPE_WEBHOOK_SECRET` = your_webhook_secret
     - `SENDGRID_API_KEY` = your_sendgrid_key (optional)
     - `NODE_ENV` = production

4. **Configure Stripe Webhook:**
   - In Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-app.railway.app/api/webhooks/stripe`
   - Select events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`
   - Copy signing secret to `STRIPE_WEBHOOK_SECRET`

### Option 2: Render (Free Tier)

1. **Push to GitHub** (same as above)

2. **Deploy on Render:**
   - Go to [render.com](https://render.com)
   - Click "New Web Service"
   - Connect your GitHub repo
   - Settings:
     - Build Command: `npm install`
     - Start Command: `node src/server.js`
   - Add environment variables (same as Railway)

### Option 3: Local Testing

```bash
cd /mnt/okcomputer/output/backend

# Create .env file
cat > .env << EOF
NODE_ENV=development
PORT=3001
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
EOF

# Install dependencies
npm install

# Start server
npm run dev
```

## Environment Variables Required

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | ✅ Yes | Your Stripe secret key (sk_test_ or sk_live_) |
| `STRIPE_WEBHOOK_SECRET` | ✅ Yes | Webhook signing secret from Stripe |
| `NODE_ENV` | ✅ Yes | `development` or `production` |
| `PORT` | No | Server port (default: 3001) |
| `SENDGRID_API_KEY` | No | For email notifications |
| `SENDGRID_FROM_EMAIL` | No | From email address |
| `ALLOWED_ORIGINS` | No | CORS origins (comma-separated) |

## Testing the API

### Health Check:
```bash
curl https://your-api.com/api/health
```

### Create Order:
```bash
curl -X POST https://your-api.com/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "1", "name": "Test Product", "quantity": 1, "price": 1000}],
    "shippingAddress": {"name": "Test User", "line1": "123 Main St", "city": "NYC", "state": "NY", "postalCode": "10001"},
    "customerEmail": "test@example.com",
    "ageVerified": true,
    "termsAccepted": true,
    "researchUseOnly": true
  }'
```

### Create Payment Intent:
```bash
curl -X POST https://your-api.com/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "usd",
    "orderId": "ORD-xxx"
  }'
```

## Database

The backend uses SQLite with the following tables:
- `orders` - Order data
- `order_items` - Line items
- `order_status_history` - Status changes
- `payment_audit_log` - Payment events

Database file is stored at `./data/orders.db`

## Security Features

- Rate limiting (100 req/15min general, 10 req/hour payments)
- Helmet security headers
- CORS protection
- Input validation
- SQL injection prevention (parameterized queries)
- Stripe webhook signature verification

## Next Steps

1. Deploy the backend to Railway/Render
2. Update frontend `VITE_API_URL` to point to deployed backend
3. Configure Stripe webhook endpoint
4. Test complete checkout flow
5. Add SendGrid for email notifications (optional)
