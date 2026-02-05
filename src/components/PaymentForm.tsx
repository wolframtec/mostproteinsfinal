import { useState } from 'react';
import { 
  PaymentElement, 
  useStripe, 
  useElements,
  ExpressCheckoutElement 
} from '@stripe/react-stripe-js';
import { Lock, AlertCircle, CheckCircle, Wallet } from 'lucide-react';

interface PaymentFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  totalAmount: number;
}

export function PaymentForm({ clientSecret: _clientSecret, onSuccess, onError, totalAmount }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'succeeded'>('idle');
  const [expressCheckoutReady, setExpressCheckoutReady] = useState(false);

  // Handle Express Checkout (Apple Pay / Google Pay)
  const handleExpressCheckout = async (event: any) => {
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
        setPaymentError(error.message || 'Payment failed. Please try again.');
        onError(error.message || 'Payment failed');
        setPaymentStatus('idle');
        event.complete('fail');
      } else {
        setPaymentStatus('succeeded');
        event.complete('success');
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment processing failed';
      setPaymentError(errorMessage);
      onError(errorMessage);
      setPaymentStatus('idle');
      event.complete('fail');
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
      // Confirm the payment using the PaymentElement
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/complete`,
        },
        redirect: 'if_required',
      });

      if (error) {
        // Payment failed
        setPaymentError(error.message || 'Payment failed. Please try again.');
        onError(error.message || 'Payment failed');
        setPaymentStatus('idle');
      } else if (paymentIntent) {
        // Payment succeeded
        if (paymentIntent.status === 'succeeded') {
          setPaymentStatus('succeeded');
          onSuccess();
        } else if (paymentIntent.status === 'requires_action') {
          // 3D Secure or other authentication required
          // Stripe.js handles this automatically
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Express Checkout - Apple Pay / Google Pay */}
      <div className="bg-biotech-black/50 border border-biotech-white/20 rounded-xl p-4">
        <label className="block text-sm text-biotech-gray mb-3 flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Quick Checkout
        </label>
        <ExpressCheckoutElement
          onReady={() => setExpressCheckoutReady(true)}
          onClick={({ resolve }) => {
            resolve({
              lineItems: [
                {
                  name: 'Research Order',
                  amount: totalAmount,
                },
              ],
            });
          }}
          onConfirm={handleExpressCheckout}
          options={{
            buttonType: {
              applePay: 'buy',
              googlePay: 'buy',
            },
            buttonHeight: 44,
          }}
        />
        {!expressCheckoutReady && (
          <p className="text-xs text-biotech-gray/60 mt-2 text-center">
            Loading express checkout options...
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-biotech-white/10"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-biotech-black text-biotech-gray">Or pay with card</span>
        </div>
      </div>

      {/* Payment Element */}
      <div className="bg-biotech-black/50 border border-biotech-white/20 rounded-xl p-4">
        <label className="block text-sm text-biotech-gray mb-2">
          Card Information
        </label>
        <div className="p-3 bg-biotech-dark rounded-lg">
          <PaymentElement 
            options={{
              layout: {
                type: 'tabs',
                defaultCollapsed: false,
              },
              paymentMethodOrder: ['card'],
            }}
          />
        </div>
        
        {/* Card Logos */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex gap-1">
            {/* Visa */}
            <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center text-xs text-white/60">VISA</div>
            {/* Mastercard */}
            <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center text-xs text-white/60">MC</div>
            {/* Amex */}
            <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center text-xs text-white/60">AMEX</div>
          </div>
          <span className="text-xs text-biotech-gray/60 ml-auto">
            Encrypted & Secure
          </span>
        </div>
      </div>

      {/* Error Message */}
      {paymentError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300/80">{paymentError}</p>
        </div>
      )}

      {/* Success Message */}
      {paymentStatus === 'succeeded' && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-300/80">Payment successful! Processing your order...</p>
        </div>
      )}

      {/* Security Notice */}
      <div className="flex items-center gap-2 text-sm text-biotech-gray">
        <Lock className="w-4 h-4 text-biotech-mint" />
        <span>Your payment is secured with 256-bit SSL encryption</span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isProcessing || !stripe || paymentStatus === 'succeeded'}
        className="w-full py-4 bg-biotech-mint text-biotech-black font-semibold rounded-xl hover:bg-biotech-mint/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-biotech-black/30 border-t-biotech-black rounded-full animate-spin" />
            Processing Payment...
          </>
        ) : paymentStatus === 'succeeded' ? (
          <>
            <CheckCircle className="w-5 h-5" />
            Payment Complete
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            Complete Purchase
          </>
        )}
      </button>

      {/* Loading State */}
      {!stripe && (
        <div className="bg-biotech-mint/10 border border-biotech-mint/20 rounded-lg p-3">
          <p className="text-sm text-biotech-mint text-center">
            Initializing secure payment system...
          </p>
        </div>
      )}
    </form>
  );
}

export default PaymentForm;
