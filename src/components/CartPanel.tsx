'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { AlertTriangle, ChevronRight, Minus, Plus, ShoppingCart, X } from 'lucide-react';
import { useCart } from '../context';

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function CartPanel({ isOpen, onClose, onCheckout }: CartPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { items, removeItem, updateQuantity, total } = useCart();

  useEffect(() => {
    if (panelRef.current && overlayRef.current) {
      if (isOpen) {
        gsap.to(overlayRef.current, { opacity: 1, duration: 0.3 });
        gsap.to(panelRef.current, { x: 0, duration: 0.4, ease: 'power3.out' });
      } else {
        gsap.to(overlayRef.current, { opacity: 0, duration: 0.3 });
        gsap.to(panelRef.current, { x: '100%', duration: 0.4, ease: 'power3.in' });
      }
    }
  }, [isOpen]);

  return (
    <>
      <div
        ref={overlayRef}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] opacity-0 pointer-events-none"
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      />
      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-biotech-dark/95 backdrop-blur-xl border-l border-biotech-white/10 z-[70] flex flex-col"
        style={{ transform: 'translateX(100%)' }}
      >
        <div className="flex items-center justify-between p-6 border-b border-biotech-white/10">
          <h2 className="text-xl font-heading font-bold text-biotech-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-biotech-mint" />
            Research Cart
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-biotech-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-biotech-gray" />
          </button>
        </div>

        {/* FDA Disclaimer in Cart */}
        <div className="px-6 py-3 bg-yellow-500/10 border-b border-yellow-500/20">
          <p className="text-xs text-yellow-400/80 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Products are for research use only. Not for human consumption. By checking out, you affirm you are a qualified researcher 21+.</span>
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className="w-16 h-16 text-biotech-gray/30 mb-4" />
              <p className="text-biotech-gray">Your research cart is empty</p>
              <p className="text-biotech-gray/60 text-sm mt-2">Add research materials to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="glass-card p-4 flex gap-4">
                  <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-xl" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="label-mono text-biotech-mint text-[10px]">{item.label}</p>
                        <h4 className="text-biotech-white font-semibold text-sm">{item.name}</h4>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="p-1 hover:bg-biotech-white/10 rounded transition-colors">
                        <X className="w-4 h-4 text-biotech-gray" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 bg-biotech-white/10 rounded hover:bg-biotech-white/20 transition-colors">
                          <Minus className="w-3 h-3 text-biotech-white" />
                        </button>
                        <span className="text-biotech-white font-mono w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 bg-biotech-white/10 rounded hover:bg-biotech-white/20 transition-colors">
                          <Plus className="w-3 h-3 text-biotech-white" />
                        </button>
                      </div>
                      <span className="text-biotech-white font-semibold">${item.price * item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-biotech-white/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-biotech-gray">Total</span>
            <span className="text-xl font-heading font-bold text-biotech-white">${total}</span>
          </div>
          <button
            onClick={onCheckout}
            disabled={items.length === 0}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            Proceed to Checkout
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}

export default CartPanel;
