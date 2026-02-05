import { useState } from 'react';
import { 
  ArrowLeft, ShoppingCart, Beaker, FileText, AlertTriangle, 
  Thermometer, Package, CheckCircle, Shield, Lock, Info,
  X, ChevronRight
} from 'lucide-react';
import { useCart, type Product } from '../context';

interface ProductPageProps {
  product: Product;
  onBack: () => void;
  onCartClick?: () => void;
}

export default function ProductPage({ product, onBack, onCartClick }: ProductPageProps) {
  const { addItem, count } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [showAddedModal, setShowAddedModal] = useState(false);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
    setShowAddedModal(true);
  };

  const handleViewCart = () => {
    setShowAddedModal(false);
    onCartClick?.();
  };

  const handleContinueShopping = () => {
    setShowAddedModal(false);
  };

  return (
    <div className="min-h-screen bg-biotech-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-biotech-black/90 backdrop-blur-xl border-b border-biotech-white/10">
        <button onClick={onBack} className="flex items-center gap-2 text-biotech-gray hover:text-biotech-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Products</span>
        </button>
        <div className="flex items-center gap-2">
          <Beaker className="w-5 h-5 text-biotech-mint" />
          <span className="font-heading font-bold text-biotech-white">Most Proteins</span>
        </div>
        {/* Cart Button */}
        <button 
          onClick={onCartClick}
          className="flex items-center gap-2 px-4 py-2 bg-biotech-dark/80 backdrop-blur-sm border border-biotech-white/10 rounded-full hover:border-biotech-mint/50 transition-colors"
        >
          <ShoppingCart className="w-4 h-4 text-biotech-mint" />
          <span className="text-sm text-biotech-white">{count}</span>
        </button>
      </nav>

      {/* FDA Warning Banner */}
      <div className="pt-20 bg-yellow-500/10 border-b border-yellow-500/20">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <p className="text-sm text-yellow-400/90 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="font-semibold">FOR RESEARCH USE ONLY</span>
            <span className="hidden sm:inline">• Not for human consumption • Not FDA approved</span>
          </p>
        </div>
      </div>

      {/* Added to Cart Modal */}
      {showAddedModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={handleContinueShopping}
          />
          <div className="relative bg-biotech-dark/95 backdrop-blur-xl border border-biotech-white/20 rounded-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <button 
              onClick={handleContinueShopping}
              className="absolute top-4 right-4 p-1 hover:bg-biotech-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-biotech-gray" />
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-heading font-bold text-biotech-white mb-2">
                Added to Cart
              </h3>
              <p className="text-biotech-gray text-sm mb-6">
                {quantity} x {product.name} has been added to your research cart.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={handleViewCart}
                  className="w-full py-3 bg-biotech-mint text-biotech-black font-semibold rounded-xl hover:bg-biotech-mint/90 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  View Cart
                </button>
                <button
                  onClick={handleContinueShopping}
                  className="w-full py-3 bg-biotech-white/10 text-biotech-white font-medium rounded-xl hover:bg-biotech-white/20 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="space-y-6">
            <div className="aspect-square rounded-2xl overflow-hidden bg-biotech-dark border border-biotech-white/10">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-card p-4 text-center">
                <CheckCircle className="w-6 h-6 text-biotech-mint mx-auto mb-2" />
                <p className="text-xs text-biotech-gray">HPLC Verified</p>
              </div>
              <div className="glass-card p-4 text-center">
                <Shield className="w-6 h-6 text-biotech-mint mx-auto mb-2" />
                <p className="text-xs text-biotech-gray">COA Included</p>
              </div>
              <div className="glass-card p-4 text-center">
                <Thermometer className="w-6 h-6 text-biotech-mint mx-auto mb-2" />
                <p className="text-xs text-biotech-gray">Cold Shipped</p>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-biotech-mint">{product.icon}</span>
                <span className="label-mono text-biotech-mint text-xs">{product.label}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-biotech-white mb-4">
                {product.name}
              </h1>
              <p className="text-biotech-gray leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Specifications */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-heading font-bold text-biotech-white mb-4 flex items-center gap-2">
                <Beaker className="w-5 h-5 text-biotech-mint" />
                Product Specifications
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-biotech-gray/70 uppercase tracking-wider">CAS Number</p>
                  <p className="text-biotech-white font-mono">{product.casNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-biotech-gray/70 uppercase tracking-wider">Molecular Weight</p>
                  <p className="text-biotech-white font-mono">{product.molecularWeight}</p>
                </div>
                <div>
                  <p className="text-xs text-biotech-gray/70 uppercase tracking-wider">Purity</p>
                  <p className="text-biotech-mint font-mono">{product.purity}</p>
                </div>
                <div>
                  <p className="text-xs text-biotech-gray/70 uppercase tracking-wider">Storage</p>
                  <p className="text-biotech-white font-mono">{product.storage}</p>
                </div>
              </div>
              {product.sequence && (
                <div className="mt-4 pt-4 border-t border-biotech-white/10">
                  <p className="text-xs text-biotech-gray/70 uppercase tracking-wider mb-1">Sequence</p>
                  <p className="text-biotech-white font-mono text-sm break-all">{product.sequence}</p>
                </div>
              )}
            </div>

            {/* Research Disclaimer */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Research Use Only
              </h4>
              <ul className="text-sm text-red-300/80 space-y-1 list-disc list-inside">
                <li>This product is for laboratory research purposes only</li>
                <li>Not for human consumption, diagnostic, or therapeutic use</li>
                <li>Not evaluated by the FDA for safety or efficacy</li>
                <li>Must be handled by qualified researchers only</li>
              </ul>
            </div>

            {/* Pricing & Purchase */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-biotech-gray">Price per unit</p>
                  <p className="text-3xl font-heading font-bold text-biotech-white">${product.price}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 bg-biotech-white/10 rounded-lg flex items-center justify-center hover:bg-biotech-white/20 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-xl font-mono text-biotech-white w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 bg-biotech-white/10 rounded-lg flex items-center justify-center hover:bg-biotech-white/20 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all bg-biotech-mint text-biotech-black hover:bg-biotech-mint/90 hover:shadow-[0_0_24px_rgba(46,233,168,0.4)] active:scale-[0.98]"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Research Cart - ${product.price * quantity}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-biotech-gray">
                <Lock className="w-4 h-4" />
                <span>Secure checkout powered by Stripe</span>
              </div>
            </div>

            {/* Documentation */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-biotech-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-biotech-mint" />
                Documentation
              </h3>
              <div className="space-y-2">
                <button className="w-full glass-card p-3 flex items-center justify-between hover:border-biotech-mint/30 transition-colors">
                  <span className="text-sm text-biotech-gray">Certificate of Analysis (COA)</span>
                  <span className="text-xs text-biotech-mint">Available on request</span>
                </button>
                <button className="w-full glass-card p-3 flex items-center justify-between hover:border-biotech-mint/30 transition-colors">
                  <span className="text-sm text-biotech-gray">Safety Data Sheet (SDS)</span>
                  <span className="text-xs text-biotech-mint">Download PDF</span>
                </button>
                <button className="w-full glass-card p-3 flex items-center justify-between hover:border-biotech-mint/30 transition-colors">
                  <span className="text-sm text-biotech-gray">Handling & Storage Guide</span>
                  <span className="text-xs text-biotech-mint">View Online</span>
                </button>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="glass-card p-4 flex items-start gap-3">
              <Package className="w-5 h-5 text-biotech-mint flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-biotech-white font-medium">Shipping Information</p>
                <p className="text-xs text-biotech-gray mt-1">
                  All orders ship within 24-48 hours via temperature-controlled packaging. 
                  Tracking provided via email. Signature required for delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer className="border-t border-biotech-white/10 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-start gap-3 text-sm text-biotech-gray/60">
            <Info className="w-5 h-5 flex-shrink-0" />
            <p>
              Most Proteins sells research chemicals only. All products are intended for laboratory research 
              purposes and are not for human consumption. By purchasing, you affirm you are a qualified 
              researcher 21 years or older. Products are not FDA approved. We make no claims regarding 
              safety or efficacy. Always consult applicable laws and regulations in your jurisdiction.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
