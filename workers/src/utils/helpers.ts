/**
 * Helper utilities for the Workers backend
 */

// Generate unique order ID
export function generateOrderId(): string {
  const prefix = 'ORD';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Generate UUID v4
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Format currency from cents to dollars
export function formatCurrency(cents: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

// Parse amount to cents
export function parseAmount(amount: string | number): number {
  if (typeof amount === 'number') return Math.round(amount);
  return Math.round(parseFloat(amount) * 100);
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Sanitize string input
export function sanitizeString(input: string | null | undefined): string | null {
  if (!input) return null;
  return input.trim().substring(0, 500); // Limit length
}

// Get client IP from request
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('cf-connecting-ip') || 'unknown';
}

// Get user agent from request
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}

// Safe JSON parse
export function safeJSONParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

// Format date for database
export function formatDate(date: Date = new Date()): string {
  return date.toISOString();
}

// Calculate pricing with tax and shipping
export function calculatePricing(
  subtotal: number,
  shipping: number = 0,
  taxRate: number = 0
): { subtotal: number; shipping: number; tax: number; total: number } {
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + shipping + tax;
  
  return {
    subtotal,
    shipping,
    tax,
    total,
  };
}

// Mask sensitive data for logging
export function maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const masked = { ...data };
  
  // Mask email
  if (masked.customerEmail && typeof masked.customerEmail === 'string') {
    const email = masked.customerEmail as string;
    const [local, domain] = email.split('@');
    masked.customerEmail = `${local.substring(0, 2)}***@${domain}`;
  }
  
  // Mask phone
  if (masked.customerPhone && typeof masked.customerPhone === 'string') {
    const phone = masked.customerPhone as string;
    masked.customerPhone = `***${phone.slice(-4)}`;
  }
  
  return masked;
}

// Sleep utility for rate limiting delays
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
