import { useRef, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart, type Product } from '../context';

interface ProductCardProps {
  product: Product;
  isVisible: boolean;
}

export const ProductCard = ({ product, isVisible }: ProductCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();

  // 3D tilt effect
  useEffect(() => {
    if (!cardRef.current) return;
    const card = cardRef.current;

    const handleMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      card.style.transform = `
        translate(-50%, -50%)
        perspective(1000px)
        rotateY(${x / 20}deg)
        rotateX(${-y / 20}deg)
        scale(1.02)
      `;
    };

    const handleLeave = () => {
      card.style.transform = 'translate(-50%, -50%) perspective(1000px) rotateY(0) rotateX(0) scale(1)';
    };

    card.addEventListener('mousemove', handleMove);
    card.addEventListener('mouseleave', handleLeave);
    return () => {
      card.removeEventListener('mousemove', handleMove);
      card.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

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

      {/* Product Image */}
      <div className="relative w-full aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden mb-4 sm:mb-5 group">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Image overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        {/* Label badge */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
          <span className="text-[#2EE9A8]">{product.icon}</span>
          <span className="text-[9px] sm:text-[10px] font-mono font-medium text-white/90 tracking-widest uppercase">
            {product.label}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="relative space-y-3 sm:space-y-4">
        {/* Product Name */}
        <h3 className="text-xl sm:text-2xl font-heading font-bold text-white tracking-tight">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-white/60 leading-relaxed line-clamp-3 sm:line-clamp-2">
          {product.description}
        </p>

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-1 sm:pt-2">
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs text-white/40 font-mono uppercase tracking-wider">Price</span>
            <span className="text-2xl sm:text-3xl font-heading font-bold text-white">
              ${product.price}
            </span>
          </div>

          <button
            onClick={() => addItem(product)}
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
