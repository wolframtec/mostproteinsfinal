# Most Proteins API

Secure backend API for payment processing and order management.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your Stripe keys

# Start server
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.js              # Main Express server
│   ├── database/
│   │   └── index.js           # In-memory storage with file persistence
│   ├── routes/
│   │   ├── health.js          # Health check endpoints
│   │   ├── orders.js          # Order management API
│   │   ├── payments.js        # Payment processing API
│   │   └── webhooks.js        # Stripe webhook handler
│   ├── services/
│   │   ├── stripeService.js   # Stripe integration
│   │   └── emailService.js    # SendGrid email service
│   ├── middleware/
│   │   ├── errorHandler.js    # Global error handler
│   │   └── requestLogger.js   # Request logging
│   └── utils/
│       └── logger.js          # Winston logger config
├── data/                      # Data storage (persistent)
├── logs/                      # Log files
├── package.json
├── .env                       # Environment variables
├── Dockerfile                 # Docker configuration
├── railway.json               # Railway deployment config
├── render.yaml                # Render deployment config
└── DEPLOY.md                  # Deployment guide
```

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | ✅ Yes | Your Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | ✅ Yes | Webhook signing secret |
| `NODE_ENV` | ✅ Yes | `development` or `production` |
| `PORT` | No | Server port (default: 3001) |
| `ALLOWED_ORIGINS` | No | CORS origins (comma-separated) |
| `SENDGRID_API_KEY` | No | For email notifications |

## 📡 API Endpoints

### Health
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system info
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

### Orders
- `POST /api/orders` - Create a new order
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id/status` - Update order status
- `GET /api/orders` - List all orders (admin)

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `GET /api/payments/:id/status` - Get payment status
- `POST /api/payments/:id/confirm` - Confirm payment
- `POST /api/payments/:id/refund` - Process refund

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook handler

## 🔒 Security Features

- ✅ Helmet.js security headers
- ✅ CORS protection
- ✅ Rate limiting (100 req/15min, 10 payments/hour)
- ✅ Input validation (express-validator)
- ✅ HPP (HTTP Parameter Pollution) protection
- ✅ SQL injection prevention
- ✅ Stripe webhook signature verification

## 🧪 Testing

```bash
# Run all API tests
./test-api.sh http://localhost:3001

# Or test manually
curl http://localhost:3001/api/health
```

## 🚢 Deployment

See [DEPLOY.md](./DEPLOY.md) for detailed deployment instructions.

### Quick Deploy to Railway

1. Push to GitHub
2. Connect repo to Railway
3. Add environment variables
4. Deploy!

## 📊 Database

Uses in-memory storage with JSON file persistence:
- Orders stored in `data/orders.json`
- Auto-saves every 30 seconds
- Survives restarts

Future upgrade: PostgreSQL for production scale.

## 📝 Logging

Structured logging with Winston:
- Console output (development)
- File logs: `logs/combined.log`, `logs/error.log`
- Request logging with unique IDs

## 📄 License

PRIVATE - All rights reserved.
