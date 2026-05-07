import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../lib/CartContext";
import { toast } from "sonner";

export default function ProductCard({ product, index = 0 }) {
  const { addItem } = useCart();
  const discounted = product.discount_percent > 0;
  const finalPrice = product.price * (1 - (product.discount_percent || 0) / 100);

  return (
    <div
      className="mi-card animate-fade-up"
      style={{ animationDelay: `${index * 60}ms` }}
      data-testid={`product-card-${product.id}`}
    >
      <Link to={`/producto/${product.id}`} className="block">
        <div className="relative bg-[#F9F9F9] aspect-square overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
            loading="lazy"
          />
          {discounted && (
            <span className="absolute top-3 left-3 mi-badge bg-[#FF6B6B] text-white" data-testid="discount-badge">
              -{product.discount_percent}%
            </span>
          )}
          {product.featured && (
            <span className="absolute top-3 right-3 mi-badge bg-[#FFD93D] text-[#1F2937]">
              Destacado
            </span>
          )}
        </div>
      </Link>
      <div className="p-4">
        <div className="text-xs font-nunito text-[#4B5563] mb-1">
          {product.category} · {product.age_range} años
        </div>
        <Link to={`/producto/${product.id}`}>
          <h3 className="font-fredoka text-lg font-semibold text-[#1F2937] line-clamp-1 hover:text-[#4CAFEE]">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="font-fredoka text-xl font-bold text-[#4CAFEE]">
            ${finalPrice.toFixed(2)} <span className="text-xs text-[#4B5563] font-nunito">MXN</span>
          </span>
          {discounted && (
            <span className="text-sm text-[#4B5563] line-through">${product.price.toFixed(2)}</span>
          )}
        </div>
        <button
          onClick={() => { addItem(product); toast.success(`${product.name} añadido al carrito`); }}
          className="mi-btn-primary w-full mt-3 flex items-center justify-center gap-2"
          data-testid={`buy-btn-${product.id}`}
        >
          <ShoppingCart size={18} /> Comprar
        </button>
      </div>
    </div>
  );
}
