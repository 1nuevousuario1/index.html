import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../lib/CartContext";
import { useAuth } from "../lib/AuthContext";
import { Trash2, ShoppingBag } from "lucide-react";

export default function Cart() {
  const { items, updateQty, removeItem, subtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center" data-testid="empty-cart">
        <ShoppingBag size={64} className="mx-auto text-[#4CAFEE]" />
        <h1 className="font-fredoka text-3xl font-bold mt-4">Tu carrito está vacío</h1>
        <p className="text-[#4B5563] font-nunito mt-2">Descubre juguetes increíbles en nuestro catálogo.</p>
        <Link to="/catalogo" className="mi-btn-primary inline-block mt-6">Ir al catálogo</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10" data-testid="cart-page">
      <h1 className="font-fredoka text-4xl font-bold text-[#1F2937]">Tu carrito</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((i) => {
            const finalPrice = i.price * (1 - (i.discount_percent || 0) / 100);
            return (
              <div key={i.product_id} className="mi-card p-4 flex gap-4" data-testid={`cart-item-${i.product_id}`}>
                <img src={i.image_url} alt={i.name} className="w-24 h-24 object-cover rounded-2xl" />
                <div className="flex-1">
                  <h3 className="font-fredoka font-semibold text-[#1F2937]">{i.name}</h3>
                  <p className="text-[#4CAFEE] font-fredoka font-bold">${finalPrice.toFixed(2)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center border-2 border-[#E5E7EB] rounded-full overflow-hidden">
                      <button className="px-3 py-1" onClick={() => updateQty(i.product_id, i.quantity - 1)}>−</button>
                      <span className="px-3 font-fredoka">{i.quantity}</span>
                      <button className="px-3 py-1" onClick={() => updateQty(i.product_id, i.quantity + 1)}>+</button>
                    </div>
                    <button onClick={() => removeItem(i.product_id)} className="ml-auto p-2 text-[#FF6B6B] hover:bg-[#FF6B6B]/10 rounded-full" data-testid={`remove-${i.product_id}`}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="text-right font-fredoka font-semibold">
                  ${(finalPrice * i.quantity).toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mi-card p-6 h-fit sticky top-24">
          <h3 className="font-fredoka text-xl font-bold">Resumen</h3>
          <div className="flex justify-between mt-4 font-nunito">
            <span>Subtotal</span>
            <span className="font-bold">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mt-2 font-nunito">
            <span>Envío</span>
            <span className="text-[#6BCB77] font-bold">Gratis</span>
          </div>
          <div className="flex justify-between mt-4 pt-4 border-t font-fredoka text-xl">
            <span>Total</span>
            <span className="text-[#4CAFEE]">${subtotal.toFixed(2)}</span>
          </div>
          <p className="mt-2 text-sm text-[#4B5563] font-nunito">🎁 Ganarás {Math.floor(subtotal)} puntos</p>
          <button
            className="mi-btn-primary w-full mt-6"
            onClick={() => (user ? navigate("/checkout") : navigate("/login?redirect=/checkout"))}
            data-testid="checkout-btn"
          >
            {user ? "Finalizar compra" : "Inicia sesión para pagar"}
          </button>
        </div>
      </div>
    </div>
  );
}
