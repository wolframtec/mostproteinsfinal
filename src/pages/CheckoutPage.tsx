import { useState } from 'react';
import { 
  ArrowLeft, Lock, CreditCard, CheckCircle, AlertTriangle,
  Shield, Truck, FileText, User, MapPin, Loader2
} from 'lucide-react';
import { useCart } from '../context';
import { StripeProvider } from '../components/StripeProvider';
import { PaymentForm } from '../components/PaymentForm';
import { orderApi, paymentApi } from '../services/api';

interface CheckoutPageProps {
  onBack: () => void;
}

export default function CheckoutPage({ onBack }: CheckoutPageProps) {
  const { items, total, clearCart } = useCart();
  const [step, setStep] = useState<'info' | 'payment' | 'confirm'>('info');
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    institution: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    researchPurpose: false,
    ageConfirm: false,
    termsAgree: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    setError(null);
  };

  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Create order on backend
      const orderResponse = await orderApi.create({
        items: items.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price * 100, // Convert to cents
        })),
        shippingAddress: {
          name: `${formData.firstName} ${formData.lastName}`,
          line1: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.zip,
          country: formData.country,
        },
        customerEmail: formData.email,
        ageVerified: formData.ageConfirm,
        termsAccepted: formData.termsAgree,
        researchUseOnly: formData.researchPurpose,
        notes: `Institution: ${formData.institution}`,
        pricing: {
          subtotal: subtotal * 100,
          shipping: 0,
          tax: 0,
          total: subtotal * 100,
        },
        compliance: {
          ageVerified: formData.ageConfirm,
          ageVerifiedAt: now,
          termsAccepted: formData.termsAgree,
          termsAcceptedAt: now,
          researchUseOnly: formData.researchPurpose,
          researchUseAcknowledgedAt: now,
        },
      } as any);

      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.error?.message || 'Failed to create order');
      }

      const createdOrderId = orderResponse.data.orderId;
      setOrderId(createdOrderId);

      // Capture user data for compliance
      const userData = {
        ...formData,
        orderId: createdOrderId,
        cartItems: items,
        total,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };
      localStorage.setItem('last_checkout_attempt', JSON.stringify(userData));

      // Create payment intent
      const paymentResponse = await paymentApi.createIntent({
        amount: orderResponse.data.total,
        currency: 'usd',
        orderId: createdOrderId,
        customerEmail: formData.email,
        metadata: {
          ageVerified: formData.ageConfirm.toString(),
          termsAccepted: formData.termsAgree.toString(),
          researchUseOnly: formData.researchPurpose.toString(),
        },
      });

      if (!paymentResponse.success || !paymentResponse.data) {
        throw new Error(paymentResponse.error?.message || 'Failed to create payment intent');
      }

      setClientSecret(paymentResponse.data.clientSecret);
      setStep('payment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setOrderComplete(true);
    clearCart();
    
    // Clear checkout data
    localStorage.removeItem('last_checkout_attempt');
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-biotech-black flex items-center justify-center p-6">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-biotech-mint/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-biotech-mint" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-biotech-white mb-2">
            Order Confirmed
          </h2>
          <p className="text-biotech-gray mb-6">
            Thank you for your research order. A confirmation email has been sent to {formData.email}.
          </p>
          <div className="bg-biotech-dark rounded-lg p-4 mb-6 text-left">
            <p className="text-xs text-biotech-gray mb-1">Order ID</p>
            <p className="text-biotech-white font-mono">{orderId}</p>
          </div>
          <button onClick={onBack} className="w-full btn-primary">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-biotech-black flex items-center justify-center p-6">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-heading font-bold text-biotech-white mb-4">
            Your cart is empty
          </h2>
          <p className="text-biotech-gray mb-6">
            Add research materials to your cart before checking out.
          </p>
          <button onClick={onBack} className="w-full btn-primary">
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-biotech-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-biotech-black/90 backdrop-blur-xl border-b border-biotech-white/10">
        <button onClick={onBack} className="flex items-center gap-2 text-biotech-gray hover:text-biotech-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Continue Shopping</span>
        </button>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-biotech-mint" />
          <span className="text-sm text-biotech-gray">Secure Checkout</span>
        </div>
      </nav>

      {/* FDA Warning */}
      <div className="pt-20 bg-yellow-500/10 border-b border-yellow-500/20">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <p className="text-sm text-yellow-400/90 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>By completing this purchase, you affirm these products are for research use only and you are a qualified researcher 21+.</span>
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Steps */}
            <div className="flex items-center gap-4 mb-8">
              <div className={`flex items-center gap-2 ${step === 'info' ? 'text-biotech-mint' : 'text-biotech-gray'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'info' ? 'bg-biotech-mint text-biotech-black' : 'bg-biotech-white/10'}`}>
                  <User className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Information</span>
              </div>
              <div className="flex-1 h-px bg-biotech-white/10" />
              <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-biotech-mint' : 'text-biotech-gray'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'payment' ? 'bg-biotech-mint text-biotech-black' : 'bg-biotech-white/10'}`}>
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Payment</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-medium">Error</p>
                  <p className="text-red-300/80 text-sm">{error}</p>
                </div>
              </div>
            )}

            {step === 'info' && (
              <form onSubmit={handleSubmitInfo} className="space-y-6">
                <div className="glass-card p-6">
                  <h3 className="text-lg font-heading font-bold text-biotech-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-biotech-mint" />
                    Researcher Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-biotech-gray mb-2">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading}
                        className="w-full bg-biotech-black/50 border border-biotech-white/20 rounded-xl px-4 py-3 text-biotech-white focus:border-biotech-mint focus:outline-none disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-biotech-gray mb-2">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading}
                        className="w-full bg-biotech-black/50 border border-biotech-white/20 rounded-xl px-4 py-3 text-biotech-white focus:border-biotech-mint focus:outline-none disabled:opacity-50"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-biotech-gray mb-2">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading}
                        className="w-full bg-biotech-black/50 border border-biotech-white/20 rounded-xl px-4 py-3 text-biotech-white focus:border-biotech-mint focus:outline-none disabled:opacity-50"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-biotech-gray mb-2">Institution/Organization *</label>
                      <input
                        type="text"
                        name="institution"
                        value={formData.institution}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading}
                        placeholder="University, Lab, or Research Facility"
                        className="w-full bg-biotech-black/50 border border-biotech-white/20 rounded-xl px-4 py-3 text-biotech-white focus:border-biotech-mint focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <h3 className="text-lg font-heading font-bold text-biotech-white mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-biotech-mint" />
                    Shipping Address
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-biotech-gray mb-2">Street Address *</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading}
                        className="w-full bg-biotech-black/50 border border-biotech-white/20 rounded-xl px-4 py-3 text-biotech-white focus:border-biotech-mint focus:outline-none disabled:opacity-50"
                      />
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-biotech-gray mb-2">City *</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                          disabled={isLoading}
                          className="w-full bg-biotech-black/50 border border-biotech-white/20 rounded-xl px-4 py-3 text-biotech-white focus:border-biotech-mint focus:outline-none disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-biotech-gray mb-2">State *</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          required
                          disabled={isLoading}
                          className="w-full bg-biotech-black/50 border border-biotech-white/20 rounded-xl px-4 py-3 text-biotech-white focus:border-biotech-mint focus:outline-none disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-biotech-gray mb-2">ZIP Code *</label>
                        <input
                          type="text"
                          name="zip"
                          value={formData.zip}
                          onChange={handleInputChange}
                          required
                          disabled={isLoading}
                          pattern="\d{5}(-\d{4})?"
                          placeholder="12345"
                          className="w-full bg-biotech-black/50 border border-biotech-white/20 rounded-xl px-4 py-3 text-biotech-white focus:border-biotech-mint focus:outline-none disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <h3 className="text-lg font-heading font-bold text-biotech-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-biotech-mint" />
                    Required Affirmations
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="researchPurpose"
                        checked={formData.researchPurpose}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading}
                        className="mt-1 w-4 h-4 accent-biotech-mint"
                      />
                      <span className="text-sm text-biotech-gray">
                        I affirm that these products will be used solely for research purposes and will not be used for human consumption, diagnostic, or therapeutic purposes.
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="ageConfirm"
                        checked={formData.ageConfirm}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading}
                        className="mt-1 w-4 h-4 accent-biotech-mint"
                      />
                      <span className="text-sm text-biotech-gray">
                        I confirm that I am 21 years of age or older and am a qualified researcher or laboratory professional.
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="termsAgree"
                        checked={formData.termsAgree}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading}
                        className="mt-1 w-4 h-4 accent-biotech-mint"
                      />
                      <span className="text-sm text-biotech-gray">
                        I agree to the Terms of Service and Privacy Policy, and understand that all products are sold for research use only and are not FDA approved.
                      </span>
                    </label>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Continue to Payment'
                  )}
                </button>
              </form>
            )}

            {step === 'payment' && clientSecret && (
              <div className="space-y-6">
                <StripeProvider clientSecret={clientSecret}>
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-heading font-bold text-biotech-white mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-biotech-mint" />
                      Payment Method
                    </h3>
                    
                    <PaymentForm 
                      clientSecret={clientSecret}
                      onSuccess={handlePaymentSuccess}
                      onError={(err) => {
                        setError(err);
                      }}
                      totalAmount={total * 100} // Convert to cents for Stripe
                    />
                  </div>
                </StripeProvider>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep('info')} 
                    disabled={isLoading}
                    className="flex-1 px-6 py-4 bg-biotech-white/10 border border-biotech-white/20 text-biotech-white font-semibold rounded-xl hover:bg-biotech-white/20 transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-heading font-bold text-biotech-white mb-4">Order Summary</h3>
              <div className="space-y-4 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                    <div className="flex-1">
                      <p className="text-sm text-biotech-white">{item.name}</p>
                      <p className="text-xs text-biotech-gray">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm text-biotech-white">${item.price * item.quantity}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-biotech-white/10 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-biotech-gray">Subtotal</span>
                  <span className="text-biotech-white">${total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-biotech-gray">Shipping</span>
                  <span className="text-biotech-mint">Free</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-biotech-white/10">
                  <span className="text-biotech-white">Total</span>
                  <span className="text-biotech-mint">${total}</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <Truck className="w-5 h-5 text-biotech-mint" />
                <span className="text-sm text-biotech-white font-medium">Free Shipping</span>
              </div>
              <p className="text-xs text-biotech-gray">
                Temperature-controlled shipping with tracking. Signature required.
              </p>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-5 h-5 text-biotech-mint" />
                <span className="text-sm text-biotech-white font-medium">Secure Checkout</span>
              </div>
              <p className="text-xs text-biotech-gray">
                PCI-DSS compliant. Your data is encrypted and never shared.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
