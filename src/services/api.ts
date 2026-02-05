/**
 * API Service
 * 
 * Handles all communication with the backend API.
 * Provides typed methods for orders, payments, and webhooks.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 30000;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

interface CreateOrderRequest {
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  customerEmail: string;
  customerPhone?: string;
  ageVerified: boolean;
  termsAccepted: boolean;
  researchUseOnly: boolean;
  notes?: string;
}

interface OrderResponse {
  orderId: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
}

interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  orderId: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
}

/**
 * Make an API request with timeout and error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred',
        },
      };
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: 'Request timed out. Please try again.',
          },
        };
      }

      // Better error messages for common issues
      let message = error.message;
      if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('load failed')) {
        message = 'Connection failed. Please check your internet connection or try disabling ad blockers/privacy extensions that may block requests to workers.dev.';
      }

      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: message,
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Order API
 */
export const orderApi = {
  /**
   * Create a new order
   */
  create: (orderData: CreateOrderRequest): Promise<ApiResponse<OrderResponse>> => {
    return apiRequest<OrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  /**
   * Get order details
   */
  get: (orderId: string, email?: string): Promise<ApiResponse<any>> => {
    const queryParams = email ? `?email=${encodeURIComponent(email)}` : '';
    return apiRequest<any>(`/orders/${orderId}${queryParams}`, {
      method: 'GET',
    });
  },

  /**
   * Update order status (admin only)
   */
  updateStatus: (
    orderId: string,
    status: string,
    paymentIntentId?: string
  ): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, paymentIntentId }),
    });
  },
};

/**
 * Payment API
 */
export const paymentApi = {
  /**
   * Create a payment intent
   */
  createIntent: (
    paymentData: CreatePaymentIntentRequest
  ): Promise<ApiResponse<PaymentIntentResponse>> => {
    return apiRequest<PaymentIntentResponse>('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  /**
   * Get payment intent status
   */
  getStatus: (paymentIntentId: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/payments/${paymentIntentId}/status`, {
      method: 'GET',
    });
  },

  /**
   * Confirm payment intent
   */
  confirm: (paymentIntentId: string, paymentMethod?: string): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/payments/${paymentIntentId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod }),
    });
  },
};

/**
 * Health API
 */
export const healthApi = {
  /**
   * Check API health
   */
  check: (): Promise<ApiResponse<{ status: string }>> => {
    return apiRequest<{ status: string }>('/health', {
      method: 'GET',
    });
  },

  /**
   * Get detailed health info
   */
  detailed: (): Promise<ApiResponse<any>> => {
    return apiRequest<any>('/health/detailed', {
      method: 'GET',
    });
  },
};

export type {
  ApiResponse,
  OrderItem,
  ShippingAddress,
  CreateOrderRequest,
  OrderResponse,
  CreatePaymentIntentRequest,
  PaymentIntentResponse,
};

export default {
  order: orderApi,
  payment: paymentApi,
  health: healthApi,
};
