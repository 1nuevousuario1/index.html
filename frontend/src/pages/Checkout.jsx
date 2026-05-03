import React, { useState } from "react";
import { useCart } from "../lib/CartContext";
import { api, formatApiErrorDetail } from "../lib/api";
import { toast } from "sonner";

export default function Checkout() {
  const { items, subtotal } = useCart();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!address.trim()) {
      toast.error("Ingresa la dirección de envío");
      return;
    }
    if (items.length === 0) return;
    setLoading(true);
    try {
      const payload = {
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        shipping_address: address,
        origin_url: window.location.origin,
      };
      const { data } = await api.post("/orders/checkout", payload);
      window.location.href = data.url;
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || e.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10" data-testid="checkout-page">
      <h1 className="font-fredoka text-4xl font-bold">Finalizar compra</h1>
      <div className="mi-card p-6 mt-8">
        <h3 className="font-fredoka text-xl font-semibold mb-4">Dirección de envío</h3>
        <textarea
          className="mi-input min-h-[120px]"
          placeholder="Calle, número, colonia, ciudad, código postal"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          data-testid="shipping-address"
        />
      </div>

      <div className="mi-card p-6 mt-6">
        <h3 className="font-fredoka text-xl font-semibold">Tu pedido</h3>
        <div className="mt-4 space-y-2">
          {items.map((i) => {
            const fp = i.price * (1 - (i.discount_percent || 0) / 100);
            return (
              <div key={i.product_id} className="flex justify-between font-nunito">
                <span>{i.name} x{i.quantity}</span>
                <span className="font-semibold">${(fp * i.quantity).toFixed(2)}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-4 pt-4 border-t font-fredoka text-xl">
          <span>Total</span>
          <span className="text-[#4CAFEE]">${subtotal.toFixed(2)}</span>
        </div>
      </div>

      <button className="mi-btn-primary w-full mt-6" disabled={loading} onClick={handlePay} data-testid="pay-now-btn">
        {loading ? "Redirigiendo a Stripe..." : "Pagar con Stripe"}
      </button>
      <p className="text-center text-sm text-[#4B5563] mt-3 font-nunito">
        Pago seguro procesado por Stripe · Acepta tarjeta de crédito/débito
      </p>
    </div>
  );
}
