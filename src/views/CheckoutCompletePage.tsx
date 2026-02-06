'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    uetq?: Array<unknown>;
  }
}
import { AlertTriangle, CheckCircle, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { useCart } from '../context';
import { paymentApi } from '../services/api';

interface CheckoutCompletePageProps {
  onBack: () => void;
  onRetry?: () => void;
}

type CompletionStatus = 'loading' | 'success' | 'failed';

export default function CheckoutCompletePage({ onBack, onRetry }: CheckoutCompletePageProps) {
  const { clearCart } = useCart();
  const [status, setStatus] = useState<CompletionStatus>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const setSafe = (fn: () => void) => {
      if (!cancelled) fn();
    };

    const stored = localStorage.getItem('last_checkout_attempt');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { orderId?: string; email?: string };
        if (parsed?.orderId) setOrderId(parsed.orderId);
        if (parsed?.email) setEmail(parsed.email);
      } catch {
        // Ignore malformed storage
      }
    }

    const params = new URLSearchParams(window.location.search);
    const redirectStatus = params.get('redirect_status');
    const paymentIntentId = params.get('payment_intent');

    const finishSuccess = () => {
      setSafe(() => {
        setStatus('success');
        setMessage(null);
      });
      clearCart();
      localStorage.removeItem('last_checkout_attempt');
      
      // Bing conversion tracking
      try {
        const stored = localStorage.getItem('last_checkout_attempt');
        let revenue = 0;
        if (stored) {
          const parsed = JSON.parse(stored);
          revenue = parsed?.amount || 0;
        }
        if (window.uetq) {
          window.uetq.push('event', 'PRODUCT_PURCHASE', {
            ecomm_prodid: orderId || 'unknown',
            ecomm_pagetype: 'PURCHASE',
            revenue_value: revenue,
            currency: 'USD'
          });
        }
      } catch (e) {
        console.log('Conversion tracking error');
      }
    };

    const finishFail = (text: string) => {
      setSafe(() => {
        setStatus('failed');
        setMessage(text);
      });
    };

    const verifyPayment = async (attempt = 0) => {
      if (redirectStatus === 'failed' || redirectStatus === 'canceled') {
        finishFail('Payment was not completed. Please try again.');
        return;
      }

      if (!paymentIntentId) {
        if (redirectStatus === 'succeeded') {
          finishSuccess();
          return;
        }
        finishFail('Missing payment confirmation details. Please try again.');
        return;
      }

      const response = await paymentApi.getStatus(paymentIntentId);
      const payload = response as {
        success?: boolean;
        error?: { message?: string };
        status?: string;
      };

      if (payload?.success === false) {
        finishFail(payload.error?.message || 'Unable to verify payment. Please try again.');
        return;
      }

      if (payload?.status === 'succeeded') {
        finishSuccess();
        return;
      }

      if (payload?.status === 'processing' || payload?.status === 'requires_action') {
        setSafe(() => {
          setStatus('loading');
          setMessage('Payment is still processing. Please wait a moment.');
        });
        if (attempt < 2) {
          setTimeout(() => {
            void verifyPayment(attempt + 1);
          }, 2500);
          return;
        }
      }

      finishFail(`Payment status: ${payload?.status || 'unknown'}. Please try again.`);
    };

    void verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-biotech-black flex items-center justify-center p-6">
      <div className="glass-card p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="w-20 h-20 bg-biotech-mint/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-biotech-mint animate-spin" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-biotech-white mb-2">
              Verifying Payment
            </h2>
            <p className="text-biotech-gray mb-6">
              {message || 'Finalizing your checkout. Please wait a moment.'}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-biotech-mint/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-biotech-mint" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-biotech-white mb-2">
              Order Confirmed
            </h2>
            <p className="text-biotech-gray mb-6">
              {email ? `A confirmation email has been sent to ${email}.` : 'Your order is confirmed.'}
            </p>
            {orderId && (
              <div className="bg-biotech-dark rounded-lg p-4 mb-6 text-left">
                <p className="text-xs text-biotech-gray mb-1">Order ID</p>
                <p className="text-biotech-white font-mono">{orderId}</p>
              </div>
            )}
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-biotech-white mb-2">
              Payment Issue
            </h2>
            <p className="text-biotech-gray mb-6">
              {message || 'We could not confirm your payment. Please try again.'}
            </p>
          </>
        )}

        <div className="space-y-3">
          {status === 'failed' && onRetry && (
            <button onClick={onRetry} className="w-full btn-primary flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Payment Again
            </button>
          )}
          <button onClick={onBack} className="w-full bg-biotech-white/10 border border-biotech-white/20 text-biotech-white font-semibold rounded-xl py-3 hover:bg-biotech-white/20 transition-colors flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
