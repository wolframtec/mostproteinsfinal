#!/bin/bash

# Test script for MostProteins API
# Usage: ./test-api.sh [base_url]

BASE_URL=${1:-"http://localhost:3001"}

echo "Testing MostProteins API at: $BASE_URL"
echo "=========================================="

# Test health endpoint
echo -e "\n1. Testing Health Endpoint..."
curl -s "$BASE_URL/api/health" | jq .

# Test create order
echo -e "\n2. Testing Create Order..."
ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "test-1", "name": "Test Product", "quantity": 1, "price": 1000}],
    "shippingAddress": {"name": "Test User", "line1": "123 Main St", "city": "NYC", "state": "NY", "postalCode": "10001"},
    "customerEmail": "test@example.com",
    "ageVerified": true,
    "termsAccepted": true,
    "researchUseOnly": true
  }')

echo "$ORDER_RESPONSE" | jq .

# Extract order ID
ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.data.orderId')

if [ "$ORDER_ID" != "null" ] && [ -n "$ORDER_ID" ]; then
  echo -e "\n3. Testing Get Order..."
  curl -s "$BASE_URL/api/orders/$ORDER_ID?email=test@example.com" | jq .
  
  echo -e "\n4. Testing Create Payment Intent..."
  curl -s -X POST "$BASE_URL/api/payments/create-intent" \
    -H "Content-Type: application/json" \
    -d "{\"amount\": 1000, \"currency\": \"usd\", \"orderId\": \"$ORDER_ID\"}" | jq .
else
  echo "Order creation failed, skipping dependent tests"
fi

echo -e "\n=========================================="
echo "Tests complete!"
