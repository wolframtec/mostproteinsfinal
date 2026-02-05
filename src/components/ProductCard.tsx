'use client';

import { useRef, useEffect } from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { useCart, type Product } from '../context';
import { renderProductIcon } from '../lib/product-icons';

interface ProductCardProps {
  product: Product;
  isVisible: boolean;
  onViewDetails?: (product: Product) => void;
}

export const ProductCard = ({ product, isVisible, onViewDetails }: ProductCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();

  // 3D tilt effect (subtle, smoothed, and desktop-only)
  useEffect(() => {
    if (!cardRef.current) return;
    const card = cardRef.current;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (prefersReducedMotion || !canHover) return;

    let frame: number | null = null;
    let tiltX = 0;
    let tiltY = 0;
    const maxTilt = 6;

    const updateTransform = () => {
      frame = null;
      card.style.transform = `
        translate(-50%, -50%)
        perspective(1200px)
        rotateX(${tiltX}deg)
        rotateY(${tiltY}deg)
        scale(1.01)
      `;
    };

    const handleMove = (e: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      tiltY = (x - 0.5) * 2 * maxTilt;
      tiltX = (0.5 - y) * 2 * maxTilt;
      if (frame === null) {
        frame = requestAnimationFrame(updateTransform);
      }
    };

    const handleLeave = () => {
      tiltX = 0;
      tiltY = 0;
      card.style.transform = 'translate(-50%, -50%) perspective(1200px) rotateY(0) rotateX(0) scale(1)';
    };

    card.addEventListener('pointermove', handleMove);
    card.addEventListener('pointerleave', handleLeave);
    return () => {
      card.removeEventListener('pointermove', handleMove);
      card.removeEventListener('pointerleave', handleLeave);
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
    };
  }, []);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails?.(product);
  };

  return (
    <div
      ref={cardRef}
      className={`
        absolute
        left-1/2
        top-1/2
        w-[90vw]
        max-w-[420px]
        p-5
        sm:p-6
        rounded-2xl
        sm:rounded-3xl
        backdrop-blur-xl
        border
        border-white/[0.15]
        shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)]
        transition-all
        duration-500
        ease-out
        ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
      style={{
        transform: 'translate(-50%, -50%)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.02) 100%)',
        transformStyle: 'preserve-3d',
        willChange: 'transform, opacity',
      }}
    >
      {/* Inner glow effect */}
      <div 
        className="absolute inset-0 rounded-2xl sm:rounded-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(46,233,168,0.08) 0%, transparent 50%)',
        }}
      />

      {/* Product Image - Click to view details */}
      <div 
        className="relative w-full aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden mb-4 sm:mb-5 group cursor-pointer"
        onClick={handleViewDetails}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Image overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        {/* Hover overlay with "View Details" hint */}
        <div className="absolute inset-0 bg-biotech-mint/0 group-hover:bg-biotech-mint/10 transition-colors duration-300 flex items-center justify-center">
          <span className="text-white font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
            View Details <ArrowRight className="w-4 h-4" />
          </span>
        </div>
        
        {/* Label badge */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
          <span className="text-[#2EE9A8]">{renderProductIcon(product.iconKey, 'w-5 h-5')}</span>
          <span className="text-[9px] sm:text-[10px] font-mono font-medium text-white/90 tracking-widest uppercase">
            {product.label}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="relative space-y-3 sm:space-y-4">
        {/* Product Name - Click to view details */}
        <h3 
          className="text-xl sm:text-2xl font-heading font-bold text-white tracking-tight cursor-pointer hover:text-biotech-mint transition-colors"
          onClick={handleViewDetails}
        >
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-white/60 leading-relaxed line-clamp-3 sm:line-clamp-2">
          {product.description}
        </p>

        {/* Price & Actions */}
        <div className="flex items-center justify-between pt-1 sm:pt-2">
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs text-white/40 font-mono uppercase tracking-wider">Price</span>
            <span className="text-2xl sm:text-3xl font-heading font-bold text-white">
              ${product.price}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Details Button */}
            <button
              onClick={handleViewDetails}
              className="
                hidden
                sm:flex
                items-center
                gap-1.5
                px-3
                py-2
                bg-white/10
                hover:bg-white/20
                text-white
                font-medium
                text-xs
                rounded-lg
                transition-all
                duration-300
              "
            >
              Details
            </button>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="
                flex
                items-center
                gap-1.5
                sm:gap-2
                px-3
                sm:px-5
                py-2
                sm:py-3
                bg-[#2EE9A8]
                hover:bg-[#25d196]
                text-black
                font-semibold
                text-xs
                sm:text-sm
                rounded-lg
                sm:rounded-xl
                transition-all
                duration-300
                hover:shadow-[0_0_24px_rgba(46,233,168,0.4)]
                active:scale-95
              "
            >
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Add to Cart</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom reflection line */}
      <div 
        className="absolute bottom-0 left-4 right-4 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
        }}
      />
    </div>
  );
};

export default ProductCard;
