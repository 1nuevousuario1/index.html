import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useCart } from "../lib/CartContext";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function ProductDetail() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    api.get(`/products/${id}`).then(({ data }) => setP(data));
  }, [id]);

  if (!p) return <div className="p-20 text-center font-fredoka">Cargando...</div>;
  const finalPrice = p.price * (1 - (p.discount_percent || 0) / 100);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10" data-testid="product-detail-page">
      <Link to="/catalogo" className="inline-flex items-center gap-2 font-fredoka text-[#4CAFEE] hover:underline mb-6">
        <ArrowLeft size={16} /> Volver al catálogo
      </Link>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="mi-card">
          <img src={p.image_url} alt={p.name} className="w-full aspect-square object-cover" />
        </div>
        <div>
          <div className="text-sm font-nunito text-[#4B5563]">{p.category} · {p.age_range} años</div>
          <h1 className="font-fredoka text-3xl sm:text-4xl font-bold text-[#1F2937] mt-2">{p.name}</h1>
          <p className="text-[#4B5563] font-nunito mt-3">{p.description}</p>
          <div className="flex items-baseline gap-3 mt-5">
            <span className="font-fredoka text-4xl font-bold text-[#4CAFEE]">${finalPrice.toFixed(2)}</span>
            {p.discount_percent > 0 && (
              <>
                <span className="text-lg text-[#4B5563] line-through">${p.price.toFixed(2)}</span>
                <span className="mi-badge bg-[#FF6B6B] text-white">-{p.discount_percent}%</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 mt-6">
            <div className="flex items-center border-2 border-[#E5E7EB] rounded-full overflow-hidden">
              <button className="px-4 py-2 font-fredoka" onClick={() => setQty(Math.max(1, qty - 1))} data-testid="qty-decrease">−</button>
              <span className="px-4 font-fredoka" data-testid="qty-value">{qty}</span>
              <button className="px-4 py-2 font-fredoka" onClick={() => setQty(qty + 1)} data-testid="qty-increase">+</button>
            </div>
            <button
              className="mi-btn-primary flex items-center gap-2"
              onClick={() => { addItem(p, qty); toast.success(`${p.name} añadido al carrito`); }}
              data-testid="add-to-cart-btn"
            >
              <ShoppingCart size={18} /> Agregar al carrito
            </button>
          </div>
          <p className="mt-4 text-sm text-[#4B5563] font-nunito">
            🎁 Ganarás <strong>{Math.floor(finalPrice * qty)} puntos</strong> con esta compra
          </p>
        </div>
      </div>
    </div>
  );
}
