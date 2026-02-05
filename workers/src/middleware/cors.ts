/**
 * CORS middleware for Cloudflare Workers
 */

import { Env } from '../index';

export function handleCORS(request: Request, env: Env): Response | null {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('Origin') || '*';
    const allowedOrigins = env.ALLOWED_ORIGINS 
      ? env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
      : [
          'http://localhost:5173',
          'http://localhost:3000',
          'https://mostproteins.com',
          'https://www.mostproteins.com',
          'https://*.pages.dev',
          'https://*.ok.kimi.link'
        ];
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.includes(origin) || 
      allowedOrigins.some(allowed => {
        if (allowed.includes('*')) {
          const regex = new RegExp(allowed.replace('*', '.*'));
          return regex.test(origin);
        }
        return false;
      });
    
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Stripe-Signature',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  
  return null;
}
