'use client';

import { useState, useEffect } from 'react';
import { 
  PaymentElement, 
  useStripe, 
  useElements,
  ExpressCheckoutElement 
} from '@stripe/react-stripe-js';
import type { StripeExpressCheckoutElementConfirmEvent, StripeExpressCheckoutElementOptions } from '@stripe/stripe-js';
import { Lock, AlertCircle, CheckCircle, Wallet, CreditCard } from 'lucide-react';

interface PaymentFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  totalAmount: number;
}

export function PaymentForm({ clientSecret, onSuccess, onError, totalAmount }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'succeeded'>('idle');
  const [expressCheckoutReady, setExpressCheckoutReady] = useState(false);
  const [expressCheckoutAvailable, setExpressCheckoutAvailable] = useState(false);
  const [applePayAvailable, setApplePayAvailable] = useState(false);

  // Check if Apple Pay is available on device
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ApplePaySession) {
      const canMakePayments = window.ApplePaySession.canMakePayments;
      setApplePayAvailable(canMakePayments);
      console.log('Apple Pay available:', canMakePayments);
    }
  }, []);

  const handleExpressCheckout = async (event: StripeExpressCheckoutElementConfirmEvent) => {
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setPaymentError(null);
    setPaymentStatus('processing');

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/complete`,
        },
        redirect: 'if_required' as const,
      });

      if (error) {
        const message = error.message || 'Payment failed. Please try again.';
        setPaymentError(message);
        onError(message);
        setPaymentStatus('idle');
        event.paymentFailed({ reason: 'fail', message });
      } else {
        setPaymentStatus('succeeded');
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment processing failed';
      setPaymentError(errorMessage);
      onError(errorMessage);
      setPaymentStatus('idle');
      event.paymentFailed({ reason: 'fail', message: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setPaymentError('Payment system is loading. Please try again.');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);
    setPaymentStatus('processing');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/complete`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setPaymentError(error.message || 'Payment failed. Please try again.');
        onError(error.message || 'Payment failed');
        setPaymentStatus('idle');
      } else if (paymentIntent) {
        if (paymentIntent.status === 'succeeded') {
          setPaymentStatus('succeeded');
          onSuccess();
        } else if (paymentIntent.status === 'requires_action') {
          setPaymentStatus('processing');
        } else {
          setPaymentError(`Payment status: ${paymentIntent.status}. Please contact support.`);
          setPaymentStatus('idle');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment processing failed';
      setPaymentError(errorMessage);
      onError(errorMessage);
      setPaymentStatus('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  const formattedAmount = (totalAmount / 100).toFixed(2);

  // Express Checkout options with Apple Pay configuration
  const expressCheckoutOptions: StripeExpressCheckoutElementOptions = {
    buttonType: {
      applePay: 'buy',
      googlePay: 'buy',
    },
    buttonHeight: 48,
    layout: {
      maxColumns: 2,
      maxRows: 1,
    },
    wallets: {
      applePay: 'auto',
      googlePay: 'auto',
    },
    // Payment methods configuration
    paymentMethods: {
      applePay: 'always',
      googlePay: 'always',
      link: 'auto',
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Express Checkout - Apple Pay / Google Pay */}
      <div className="bg-biotech-black/50 border border-biotech-white/20 rounded-xl p-4">
        <label className="block text-sm text-biotech-gray mb-3 flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Quick Checkout
          {applePayAvailable && (
            <span className="text-xs text-biotech-mint ml-auto">Apple Pay detected</span>
          )}
        </label>
        
        <ExpressCheckoutElement
          onReady={({ availablePaymentMethods }) => {
            setExpressCheckoutReady(true);
            const hasExpress = !!availablePaymentMethods;
            setExpressCheckoutAvailable(hasExpress);
            console.log('Express checkout available:', hasExpress, availablePaymentMethods);
          }}
          onClick={({ resolve }) => {
            const total = totalAmount;
            resolve({
              lineItems: [
                {
                  name: 'Research Order',
                  amount: total,
                },
              ],
            });
          }}
          onConfirm={handleExpressCheckout}
          options={expressCheckoutOptions}
        />
        
        {/* Show loading state */}
        {!expressCheckoutReady && (
          <div className="flex items-center justify-center gap-2 py-3">
            <div className="w-4 h-4 border-2 border-biotech-mint/30 border-t-biotech-mint rounded-full animate-spin" />
            <span className="text-xs text-biotech-gray">Loading payment options...</span>
          </div>
        )}
        
        {/* Show message if no express checkout */}
        {expressCheckoutReady && !expressCheckoutAvailable && (
          <div className="text-xs text-biotech-gray/60 mt-2 text-center">
            <p>Apple Pay and Google Pay not available</p>
            <p className="mt-1">Please use card payment below</p>
            {applePayAvailable && (
              <p className="text-yellow-500 mt-1">
                Note: Apple Pay is supported on this device but may require domain verification in Stripe.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      {(!expressCheckoutReady || expressCheckoutAvailable) && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-biotech-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-biotech-black text-biotech-gray">Or pay with card</span>
          </div>
        </div>
      )}

      {/* Card Payment Section */}
      <div className="bg-biotech-black/50 border border-biotech-white/20 rounded-xl p-4">
        <label className="block text-sm text-biotech-gray mb-3 flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Card Information
        </label>
        
        <div className="p-4 bg-biotech-dark rounded-lg border border-biotech-white/10">
          <PaymentElement 
            key={clientSecret}
            options={{
              layout: 'tabs',
              paymentMethodOrder: ['card'],
            }}
          />
        </div>
        
        <div className="flex items-center gap-2 mt-4">
          <div className="flex gap-2">
            <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center text-[10px] text-white/60 font-medium">VISA</div>
            <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center text-[10px] text-white/60 font-medium">MC</div>
            <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center text-[10px] text-white/60 font-medium">AMEX</div>
            <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center text-[10px] text-white/60 font-medium">DISC</div>
          </div>
          <span className="text-xs text-biotech-gray/60 ml-auto flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Encrypted
          </span>
        </div>
      </div>

      {/* Error Message */}
      {paymentError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Payment Error</p>
            <p className="text-sm text-red-300/80">{paymentError}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {paymentStatus === 'succeeded' && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-300/80">Payment successful! Processing your order...</p>
        </div>
      )}

      {/* Security Notice */}
      <div className="flex items-center gap-2 text-sm text-biotech-gray bg-biotech-white/5 p-3 rounded-lg">
        <Lock className="w-4 h-4 text-biotech-mint flex-shrink-0" />
        <span>Your payment is secured with 256-bit SSL encryption</span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isProcessing || !stripe}
        className="w-full btn-primary py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-biotech-black/30 border-t-biotech-black rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          <span>Pay ${formattedAmount}</span>
        )}
      </button>
    </form>
  );
}

export default PaymentForm;
