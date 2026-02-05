# Stripe Webhook Setup Guide

## Overview

Your Cloudflare Workers backend is configured to receive Stripe webhooks for payment events. This guide explains how to properly configure and verify the webhook.

## Environment Variables

The following secrets must be set in your Cloudflare Workers environment:

| Variable Name | Purpose | How to Get |
|--------------|---------|------------|
| `STRIPE_SECRET_KEY` | For API calls to Stripe | Stripe Dashboard → Developers → API Keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | For verifying webhook signatures | Stripe Dashboard → Webhooks → Signing secret |

## Setting the Webhook Secret

### Step 1: Configure Webhook in Stripe Dashboard

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"+ Add endpoint"**
3. Enter your endpoint URL:
   ```
   https://mostproteins-api.justbreatheaire.workers.dev/api/webhooks/stripe
   ```
4. Select these events:
   - ✅ `payment_intent.succeeded` - Payment successful
   - ✅ `payment_intent.payment_failed` - Payment failed
   - ✅ `payment_intent.canceled` - Payment canceled
   - ✅ `charge.refunded` - Refund processed
5. Click **"Add endpoint"**

### Step 2: Get the Webhook Signing Secret

1. Click on your newly created webhook endpoint
2. Look for **"Signing secret"** section
3. Click **"Reveal"** 
4. Copy the secret (starts with `whsec_`)

### Step 3: Set the Secret in Cloudflare

Run this command:

```bash
cd workers
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

When prompted, paste your webhook signing secret (`whsec_...`)

### Step 4: Verify Configuration

Check if the webhook is configured:

```bash
curl https://mostproteins-api.justbreatheaire.workers.dev/api/health
```

You should see:
```json
{
  "status": "ok",
  "checks": {
    "stripe": "configured",
    "webhooks": "configured"
  }
}
```

## Webhook Event Handling

Your backend handles these events:

| Event | Action |
|-------|--------|
| `payment_intent.succeeded` | Updates order status to "paid" |
| `payment_intent.payment_failed` | Updates order status to "payment_failed" |
| `payment_intent.canceled` | Updates order status to "canceled" |
| `charge.refunded` | Updates order status to "refunded" |
| `charge.dispute.created` | Logs dispute for manual review |

## Testing Webhooks

### Option 1: Using Stripe CLI (Recommended)

1. Install Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local environment:
   ```bash
   stripe listen --forward-to localhost:8787/api/webhooks/stripe
   ```

4. Trigger a test event:
   ```bash
   stripe trigger payment_intent.succeeded
   ```

### Option 2: Using Stripe Dashboard

1. Go to your webhook endpoint in Stripe Dashboard
2. Click **"Send test event"**
3. Select event type (e.g., `payment_intent.succeeded`)
4. Click **"Send test event"**

### Option 3: Real Payment Test

1. Complete a real checkout on your site
2. Check webhook logs in Stripe Dashboard
3. Verify order status updated in your database

## Webhook Security

Your webhook endpoint:
- ✅ Verifies Stripe signature on every request
- ✅ Rejects requests without signatures (returns 400)
- ✅ Returns 503 if webhook secret is not configured
- ✅ Logs all webhook events for audit trail
- ✅ Updates order status atomically in database

## Troubleshooting

### "Webhook not configured" error

```bash
# Check if secret is set
npx wrangler secret list

# If not set, add it
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

### "Invalid signature" error

- Ensure you're using the correct signing secret from the right webhook endpoint
- Each webhook endpoint has its own unique signing secret
- Don't confuse with API keys or other secrets

### Webhook not receiving events

1. Check endpoint URL is correct (must be HTTPS)
2. Verify events are selected in Stripe Dashboard
3. Check webhook delivery attempts in Stripe Dashboard → Logs
4. Check Cloudflare Workers logs:
   ```bash
   npx wrangler tail
   ```

### Mobile Payments (Apple Pay / Google Pay)

For mobile wallets to work, you must:

1. **Verify your domain in Stripe:**
   - Go to Stripe Dashboard → Settings → Payment methods
   - Add `mostproteins.com` to Apple Pay / Google Pay domains
   - Download verification file and upload to your site

2. **Configure Apple Pay:**
   - Go to [Stripe Apple Pay Settings](https://dashboard.stripe.com/settings/payments/apple_pay)
   - Add domain: `mostproteins.com`
   - Download `apple-developer-merchantid-domain-association` file
   - Upload to: `https://mostproteins.com/.well-known/apple-developer-merchantid-domain-association`

3. **Test on real device:**
   - Apple Pay only works on real Apple devices with Safari
   - Google Pay works on Android with Chrome
   - Won't show in desktop browsers or emulators

## Monitoring

View webhook delivery logs:
```bash
npx wrangler tail
```

Check webhook status in Stripe Dashboard:
- Go to [Webhooks](https://dashboard.stripe.com/webhooks)
- Click on your endpoint
- View "Delivery attempts" and "Recent deliveries"

## Summary

| What | Value |
|------|-------|
| Webhook URL | `https://mostproteins-api.justbreatheaire.workers.dev/api/webhooks/stripe` |
| Secret Name | `STRIPE_WEBHOOK_SECRET` |
| Events | payment_intent.succeeded, payment_intent.payment_failed, payment_intent.canceled, charge.refunded |
| Security | Signature verification required |
