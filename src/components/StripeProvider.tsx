'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Stripe public key - provided by client
const STRIPE_PUBLIC_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ?? '';

interface StripeProviderProps {
  children: ReactNode;
  clientSecret?: string;
}

export function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initStripe = async () => {
      if (!STRIPE_PUBLIC_KEY) {
        setIsLoading(false);
        return;
      }

      try {
        const stripeInstance = await loadStripe(STRIPE_PUBLIC_KEY);
        if (!stripeInstance) {
          setError('Failed to initialize payment system. Please try again later.');
          return;
        }
        setStripe(stripeInstance);
      } catch (err) {
        setError('Failed to load payment system. Please try again later.');
        console.error('Stripe initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initStripe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-biotech-mint/30 border-t-biotech-mint rounded-full animate-spin mx-auto mb-4" />
          <p className="text-biotech-gray">Loading payment system...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-heading font-bold text-biotech-white mb-2">Payment System Error</h3>
        <p className="text-biotech-gray mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-2 bg-biotech-mint text-biotech-black font-semibold rounded-lg hover:bg-biotech-mint/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!stripe) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 text-center">
        <h3 className="text-lg font-heading font-bold text-biotech-white mb-2">Demo Mode</h3>
        <p className="text-biotech-gray mb-4">
          Stripe is not configured. To enable payments, set
          {' '}
          <span className="text-biotech-white font-mono">NEXT_PUBLIC_STRIPE_PUBLIC_KEY</span>
          {' '}
          in the environment.
        </p>
        <div className="bg-biotech-black/50 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-400/80">
            <strong>Note:</strong> Checkout will proceed in demo mode without actual payment processing.
          </p>
        </div>
        {children}
      </div>
    );
  }

  // If we have a clientSecret, configure Elements with it
  // Otherwise, render without options (for cases where Elements is needed but no payment intent yet)
  const elementsOptions = clientSecret ? {
    clientSecret,
    appearance: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#2EE9A8',
        colorBackground: '#0B0C10',
        colorText: '#F4F6FA',
        colorDanger: '#ef4444',
        borderRadius: '12px',
        fontFamily: 'IBM Plex Mono, monospace',
        spacingUnit: '4px',
        fontSizeBase: '14px',
      },
      rules: {
        '.Input': {
          backgroundColor: '#111318',
          border: '1px solid rgba(244, 246, 250, 0.2)',
          padding: '12px',
          color: '#F4F6FA',
        },
        '.Input:focus': {
          border: '1px solid #2EE9A8',
          boxShadow: '0 0 0 1px #2EE9A8',
        },
        '.Tab': {
          backgroundColor: '#111318',
          border: '1px solid rgba(244, 246, 250, 0.2)',
          color: '#F4F6FA',
        },
        '.Tab:hover': {
          backgroundColor: 'rgba(46, 233, 168, 0.05)',
        },
        '.Tab--selected': {
          backgroundColor: 'rgba(46, 233, 168, 0.1)',
          border: '1px solid #2EE9A8',
          color: '#2EE9A8',
        },
        '.Label': {
          color: '#A6ACB8',
          fontSize: '14px',
          marginBottom: '8px',
        },
        '.Error': {
          color: '#ef4444',
        },
        '.CheckBox': {
          color: '#F4F6FA',
        },
      },
    },
    loader: 'auto' as const,
  } : undefined;

  return (
    <Elements stripe={stripe} options={elementsOptions}>
      {children}
    </Elements>
  );
}

export default StripeProvider;
