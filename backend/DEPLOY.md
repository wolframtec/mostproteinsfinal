# Deploy MostProteins Backend

## Quick Deploy to Railway (Recommended)

### Step 1: Push to GitHub

```bash
cd /mnt/okcomputer/output/backend

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial backend deployment"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/mostproteins-api.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `mostproteins-api` repository
4. Railway will auto-detect Node.js and deploy

### Step 3: Add Environment Variables

In Railway Dashboard → Your Project → Variables, add:

```
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_5QdogZ85g4UQW0YWTV6OS2Zo0E5CZ6UP
ALLOWED_ORIGINS=https://mostproteins.com,https://*.ok.kimi.link,https://zzy62zvs4jziy.ok.kimi.link
```

### Step 4: Configure Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Endpoint URL: `https://your-app.railway.app/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Save

### Step 5: Update Frontend

Update your frontend `.env`:

```
VITE_API_URL=https://your-app.railway.app/api
```

Redeploy frontend.

---

## Deploy to Render

### Step 1: Push to GitHub (same as above)

### Step 2: Create Web Service on Render

1. Go to [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repo
4. Settings:
   - **Name**: mostproteins-api
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Plan**: Free

### Step 3: Add Environment Variables

In Render Dashboard → Your Service → Environment, add the same variables as Railway.

### Step 4: Add Disk (for data persistence)

1. Go to "Disks" tab
2. Click "Add Disk"
   - **Name**: data
   - **Mount Path**: /app/data
   - **Size**: 1 GB

### Step 5: Configure Stripe Webhook

Same as Railway, but use your Render URL.

---

## Testing the API

### Health Check
```bash
curl https://your-api.com/api/health
```

### Create Order
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

### Create Payment Intent
```bash
curl -X POST https://your-api.com/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "usd",
    "orderId": "ORD-xxx"
  }'
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| POST | /api/orders | Create order |
| GET | /api/orders/:id | Get order |
| PATCH | /api/orders/:id/status | Update order status |
| POST | /api/payments/create-intent | Create payment |
| GET | /api/payments/:id/status | Get payment status |
| POST | /api/webhooks/stripe | Stripe webhook |

---

## Troubleshooting

### "Cannot find module"
- Make sure `npm install` ran successfully
- Check that all files were pushed to GitHub

### "Database error"
- Ensure data directory exists and is writable
- On Render: Make sure disk is mounted

### "Stripe error"
- Verify STRIPE_SECRET_KEY is correct
- Check that webhook secret matches Stripe dashboard

### "CORS error"
- Add your frontend domain to ALLOWED_ORIGINS
- Format: comma-separated, no spaces
