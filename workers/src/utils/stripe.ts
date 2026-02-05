/**
 * Stripe utilities for webhook verification
 * Uses Web Crypto API instead of Node.js crypto
 */

/**
 * Verify Stripe webhook signature using Web Crypto API
 * Compatible with Cloudflare Workers
 */
export async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Stripe signature format: t=timestamp,v1=signature,v0=...
    const elements = signature.split(',');
    const signatureMap = new Map<string, string>();
    
    for (const element of elements) {
      const [key, value] = element.split('=');
      signatureMap.set(key.trim(), value.trim());
    }
    
    const timestamp = signatureMap.get('t');
    const v1Signature = signatureMap.get('v1');
    
    if (!timestamp || !v1Signature) {
      console.error('Missing timestamp or signature');
      return false;
    }
    
    // Check timestamp (reject if older than 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const eventTime = parseInt(timestamp, 10);
    if (now - eventTime > 300) {
      console.error('Webhook timestamp too old');
      return false;
    }
    
    // Construct signed payload
    const signedPayload = `${timestamp}.${payload}`;
    
    // Compute HMAC using Web Crypto API
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(signedPayload)
    );
    
    // Convert to hex
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Constant-time comparison
    return timingSafeEqual(computedSignature, v1Signature);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Stripe API helper function
 * Makes authenticated requests to Stripe API
 */
export async function stripeAPI(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: Record<string, unknown>,
  stripeKey?: string
): Promise<Response> {
  const url = `https://api.stripe.com/v1${endpoint}`;
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${stripeKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  
  const options: RequestInit = {
    method,
    headers,
  };
  
  if (body && method !== 'GET') {
    // Convert body to URL-encoded format
    // Stripe expects nested objects as: parent[key]=value
    const params = new URLSearchParams();
    
    function flattenObject(obj: Record<string, unknown>, prefix = ''): void {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}[${key}]` : key;
        
        if (value === undefined || value === null) {
          continue;
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          // Recursively flatten nested objects
          flattenObject(value as Record<string, unknown>, fullKey);
        } else {
          params.append(fullKey, String(value));
        }
      }
    }
    
    flattenObject(body);
    options.body = params.toString();
  }
  
  return fetch(url, options);
}

/**
 * Create Stripe PaymentIntent
 */
export async function createPaymentIntent(
  params: {
    amount: number;
    currency: string;
    orderId: string;
    customerEmail: string;
    metadata?: Record<string, string>;
  },
  stripeKey: string
): Promise<{
  id: string;
  client_secret: string;
  status: string;
  amount: number;
  currency: string;
}> {
  // Build request body with nested objects
  const requestBody: Record<string, unknown> = {
    amount: params.amount,
    currency: params.currency.toLowerCase(),
    metadata: {
      order_id: params.orderId,
      ...(params.metadata || {})
    },
    receipt_email: params.customerEmail,
    automatic_payment_methods: { 
      enabled: true,
      allow_redirects: 'never'
    },
    payment_method_options: {
      card: {
        request_three_d_secure: 'automatic'
      }
    },
  };
  
  const response = await stripeAPI('/payment_intents', 'POST', requestBody, stripeKey);
  
  if (!response.ok) {
    const error = await response.json() as { error?: { message?: string } };
    throw new Error(error.error?.message || 'Failed to create payment intent');
  }
  
  return response.json() as Promise<{
    id: string;
    client_secret: string;
    status: string;
    amount: number;
    currency: string;
  }>;
}

/**
 * Retrieve Stripe PaymentIntent
 */
export async function retrievePaymentIntent(
  paymentIntentId: string,
  stripeKey: string
): Promise<{
  id: string;
  status: string;
  amount: number;
  currency: string;
  charges?: { data: Array<{ receipt_url?: string }> };
}> {
  const response = await stripeAPI(`/payment_intents/${paymentIntentId}`, 'GET', undefined, stripeKey);
  
  if (!response.ok) {
    throw new Error('Failed to retrieve payment intent');
  }
  
  return response.json() as Promise<{
    id: string;
    status: string;
    amount: number;
    currency: string;
    charges?: { data: Array<{ receipt_url?: string }> };
  }>;
}
