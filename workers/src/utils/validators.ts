/**
 * Input validation utilities
 */

import { isValidEmail, sanitizeString } from './helpers';

export interface ValidationResult {
  valid: boolean;
  message?: string;
  errors?: Record<string, string>;
}

// Validate order creation
export function validateOrder(data: Record<string, unknown>): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Check required fields
  if (!data.customerEmail || typeof data.customerEmail !== 'string') {
    errors.customerEmail = 'Customer email is required';
  } else if (!isValidEmail(data.customerEmail)) {
    errors.customerEmail = 'Invalid email format';
  }
  
  // Validate items
  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.items = 'At least one item is required';
  } else {
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i] as Record<string, unknown>;
      if (!item.productId) errors[`items[${i}].productId`] = 'Product ID required';
      if (!item.name) errors[`items[${i}].name`] = 'Product name required';
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
        errors[`items[${i}].quantity`] = 'Valid quantity required';
      }
      if (typeof item.price !== 'number' || item.price < 0) {
        errors[`items[${i}].price`] = 'Valid price required';
      }
    }
  }
  
  // Validate shipping address
  const shippingAddress = data.shippingAddress as Record<string, unknown> | undefined;
  if (!shippingAddress) {
    errors.shippingAddress = 'Shipping address is required';
  } else {
    if (!shippingAddress.name) errors['shippingAddress.name'] = 'Name required';
    if (!shippingAddress.line1) errors['shippingAddress.line1'] = 'Address line 1 required';
    if (!shippingAddress.city) errors['shippingAddress.city'] = 'City required';
    if (!shippingAddress.state) errors['shippingAddress.state'] = 'State required';
    if (!shippingAddress.postalCode) errors['shippingAddress.postalCode'] = 'Postal code required';
  }
  
  // Validate pricing
  const pricing = data.pricing as Record<string, number> | undefined;
  if (!pricing) {
    errors.pricing = 'Pricing information is required';
  } else {
    if (typeof pricing.subtotal !== 'number' || pricing.subtotal < 0) {
      errors['pricing.subtotal'] = 'Valid subtotal required';
    }
    if (typeof pricing.total !== 'number' || pricing.total < 0) {
      errors['pricing.total'] = 'Valid total required';
    }
  }
  
  // Validate compliance
  const compliance = data.compliance as Record<string, boolean> | undefined;
  if (!compliance) {
    errors.compliance = 'Compliance information is required';
  } else {
    if (!compliance.ageVerified) {
      errors['compliance.ageVerified'] = 'Age verification required (21+)';
    }
    if (!compliance.termsAccepted) {
      errors['compliance.termsAccepted'] = 'Terms acceptance required';
    }
    if (compliance.researchUseOnly !== true) {
      errors['compliance.researchUseOnly'] = 'Research use acknowledgment required';
    }
  }
  
  if (Object.keys(errors).length > 0) {
    return {
      valid: false,
      message: 'Validation failed',
      errors,
    };
  }
  
  return { valid: true };
}

// Validate payment intent creation
export function validatePaymentIntent(data: Record<string, unknown>): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (!data.amount || typeof data.amount !== 'number' || data.amount < 50) {
    errors.amount = 'Amount must be at least 50 cents';
  }
  
  if (!data.currency || typeof data.currency !== 'string') {
    errors.currency = 'Currency is required';
  }
  
  if (!data.orderId || typeof data.orderId !== 'string') {
    errors.orderId = 'Order ID is required';
  }
  
  if (Object.keys(errors).length > 0) {
    return {
      valid: false,
      message: 'Validation failed',
      errors,
    };
  }
  
  return { valid: true };
}

// Sanitize order input data
export function sanitizeOrderInput(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  // Sanitize strings
  sanitized.customerEmail = sanitizeString(data.customerEmail as string)?.toLowerCase();
  sanitized.customerPhone = sanitizeString(data.customerPhone as string);
  sanitized.notes = sanitizeString(data.notes as string);
  
  // Keep arrays and objects as-is
  if (Array.isArray(data.items)) {
    sanitized.items = data.items.map(item => ({
      ...item as Record<string, unknown>,
      name: sanitizeString((item as Record<string, unknown>).name as string),
    }));
  }
  
  if (data.shippingAddress) {
    const addr = data.shippingAddress as Record<string, unknown>;
    sanitized.shippingAddress = {
      name: sanitizeString(addr.name as string),
      line1: sanitizeString(addr.line1 as string),
      line2: sanitizeString(addr.line2 as string),
      city: sanitizeString(addr.city as string),
      state: sanitizeString(addr.state as string)?.toUpperCase(),
      postalCode: sanitizeString(addr.postalCode as string),
      country: sanitizeString(addr.country as string)?.toUpperCase() || 'US',
    };
  }
  
  // Keep numeric values
  if (data.pricing) {
    sanitized.pricing = data.pricing;
  }
  
  // Keep compliance booleans
  if (data.compliance) {
    sanitized.compliance = data.compliance;
  }
  
  return sanitized;
}

// Validate state code (US)
export function isValidUSState(state: string): boolean {
  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    'DC', 'PR', 'VI', 'GU', 'AS', 'MP'
  ];
  return states.includes(state.toUpperCase());
}

// Validate postal code (US)
export function isValidUSPostalCode(postalCode: string): boolean {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(postalCode);
}
