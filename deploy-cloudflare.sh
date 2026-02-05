#!/bin/bash

# Most Proteins - Cloudflare Deployment Script
# This script deploys both the backend (Workers) and frontend (Pages)

set -e

echo "🚀 Most Proteins - Cloudflare Deployment"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI not found. Installing...${NC}"
    npm install -g wrangler
fi

# Check if user is logged in
echo -e "${BLUE}🔐 Checking Cloudflare authentication...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Please login to Cloudflare:${NC}"
    wrangler login
fi

echo -e "${GREEN}✅ Authenticated with Cloudflare${NC}"
echo ""

# ============================================
# BACKEND DEPLOYMENT (Workers + D1)
# ============================================
echo -e "${BLUE}📦 Step 1: Deploying Backend (Workers)${NC}"
echo "-------------------------------------------"

cd workers

# Check if database exists
echo -e "${BLUE}🗄️  Checking D1 Database...${NC}"
if ! wrangler d1 list | grep -q "mostproteins-db"; then
    echo -e "${YELLOW}⚠️  D1 Database not found. Creating...${NC}"
    wrangler d1 create mostproteins-db
    echo -e "${YELLOW}⚠️  Please update wrangler.toml with the database_id${NC}"
    echo -e "${YELLOW}   Then run this script again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ D1 Database exists${NC}"

# Run migrations
echo -e "${BLUE}🔄 Running database migrations...${NC}"
wrangler d1 execute mostproteins-db --file=./src/database/schema.sql --local
wrangler d1 execute mostproteins-db --file=./src/database/schema.sql

echo -e "${GREEN}✅ Database migrations complete${NC}"

# Check for required secrets
echo -e "${BLUE}🔑 Checking secrets...${NC}"

if ! wrangler secret list | grep -q "STRIPE_SECRET_KEY"; then
    echo -e "${YELLOW}⚠️  STRIPE_SECRET_KEY not set${NC}"
    echo -e "${YELLOW}   Set it with: wrangler secret put STRIPE_SECRET_KEY${NC}"
    echo ""
    read -p "Enter your Stripe Secret Key (sk_live_...): " stripe_key
    echo "$stripe_key" | wrangler secret put STRIPE_SECRET_KEY
fi

if ! wrangler secret list | grep -q "STRIPE_WEBHOOK_SECRET"; then
    echo -e "${YELLOW}⚠️  STRIPE_WEBHOOK_SECRET not set${NC}"
    echo -e "${YELLOW}   You can set this later after configuring the webhook in Stripe Dashboard${NC}"
    echo -e "${YELLOW}   Set it with: wrangler secret put STRIPE_WEBHOOK_SECRET${NC}"
fi

echo -e "${GREEN}✅ Secrets configured${NC}"

# Deploy worker
echo -e "${BLUE}🚀 Deploying Worker...${NC}"
wrangler deploy

echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
echo ""

# Get worker URL
WORKER_URL=$(wrangler info --json 2>/dev/null | grep -o 'https://[^"]*workers.dev' | head -1 || echo "")
if [ -z "$WORKER_URL" ]; then
    WORKER_URL="https://mostproteins-api.YOUR_SUBDOMAIN.workers.dev"
fi

echo -e "${BLUE}🔗 Worker URL: $WORKER_URL${NC}"
echo ""

API_URL="${WORKER_URL}/api"

cd ..

# ============================================
# FRONTEND DEPLOYMENT (Pages)
# ============================================
echo -e "${BLUE}📦 Step 2: Deploying Frontend (Pages)${NC}"
echo "-------------------------------------------"

# Update API URL in wrangler.toml
echo -e "${BLUE}📝 Updating API configuration...${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|NEXT_PUBLIC_API_URL = \"[^\"]*\"|NEXT_PUBLIC_API_URL = \"$API_URL\"|" wrangler.toml
else
    # Linux
    sed -i "s|NEXT_PUBLIC_API_URL = \"[^\"]*\"|NEXT_PUBLIC_API_URL = \"$API_URL\"|" wrangler.toml
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📥 Installing dependencies...${NC}"
    npm install
fi

# Build the app
echo -e "${BLUE}🔨 Building frontend...${NC}"
npx @cloudflare/next-on-pages@1

# Deploy to Pages
echo -e "${BLUE}🚀 Deploying to Cloudflare Pages...${NC}"
wrangler pages deploy .vercel/output/static --project-name=mostproteins

echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
echo ""

# ============================================
# POST-DEPLOYMENT
# ============================================
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "========================================="
echo ""
echo -e "${BLUE}🔗 URLs:${NC}"
echo "  Backend API: $WORKER_URL"
echo "  Frontend:    https://mostproteins.pages.dev"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "  1. Configure Stripe webhook:"
echo "     URL: $WORKER_URL/api/webhooks/stripe"
echo "     Events: payment_intent.succeeded, payment_intent.payment_failed"
echo ""
echo "  2. Copy webhook signing secret and set it:"
echo "     cd workers && wrangler secret put STRIPE_WEBHOOK_SECRET"
echo ""
echo "  3. Test the deployment:"
echo "     curl $WORKER_URL/api/health"
echo ""
echo "  4. Update your custom domain DNS to point to Cloudflare Pages"
echo ""
