import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../lib/CartContext";
import { api, formatApiErrorDetail, resolveAssetUrl } from "../lib/api";
import { toast } from "sonner";

export default function Checkout() {
  const { items, subtotal } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      navigate("/carrito");
    }
  }, [items.length, navigate]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    if (!form.name.trim()) return "Ingresa tu nombre completo";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Ingresa un email válido";
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 10) return "Ingresa un teléfono de al menos 10 dígitos";
    if (!form.address.trim() || form.address.trim().length < 10) return "Ingresa una dirección de envío completa";
    return null;
  };

  const handlePay = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    if (items.length === 0) return;
    setLoading(true);
    try {
      const payload = {
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        customer_name: form.name.trim(),
        customer_email: form.email.trim(),
        customer_phone: form.phone.trim(),
        shipping_address: form.address.trim(),
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
      <p className="text-[#4B5563] font-nunito mt-1">Completa tus datos y procederemos al pago seguro con Stripe.</p>

      <div className="mi-card p-6 mt-8">
        <h3 className="font-fredoka text-xl font-semibold mb-4">Tus datos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-fredoka mb-1">Nombre completo</label>
            <input
              className="mi-input"
              placeholder="Ej. Ana López García"
              value={form.name}
              onChange={set("name")}
              data-testid="checkout-name"
            />
          </div>
          <div>
            <label className="block text-sm font-fredoka mb-1">Email</label>
            <input
              type="email"
              className="mi-input"
              placeholder="tu@email.com"
              value={form.email}
              onChange={set("email")}
              data-testid="checkout-email"
            />
          </div>
          <div>
            <label className="block text-sm font-fredoka mb-1">Teléfono</label>
            <input
              type="tel"
              className="mi-input"
              placeholder="Ej. 5512345678"
              value={form.phone}
              onChange={set("phone")}
              data-testid="checkout-phone"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-fredoka mb-1">Dirección de envío</label>
            <textarea
              className="mi-input min-h-[100px]"
              placeholder="Calle, número, colonia, ciudad, código postal, estado"
              value={form.address}
              onChange={set("address")}
              data-testid="checkout-address"
            />
          </div>
        </div>
        <div className="mt-4 p-4 bg-[#4CAFEE]/10 rounded-2xl border border-[#4CAFEE]/30">
          <p className="font-fredoka font-semibold text-sm text-[#1F2937] mb-2">🚚 Política de envío</p>
          <ul className="text-xs text-[#4B5563] font-nunito space-y-1">
            <li>📍 <strong>Misma ciudad (Ciudad Miguel Alemán)</strong>: entrega con costo de reparto local</li>
            <li>🇲🇽 <strong>Otras ciudades</strong>: envíos a toda la República Mexicana con costo de envío</li>
            <li className="text-[#6BCB77] font-semibold">💎 En compras mayores a $2,000 MXN, el envío es GRATIS</li>
          </ul>
          <p className="mt-2 text-xs text-[#4B5563] italic">
            El costo exacto de envío se acordará después de tu compra según tu ubicación.
          </p>
        </div>
      </div>

      <div className="mi-card p-6 mt-6">
        <h3 className="font-fredoka text-xl font-semibold">Tu pedido</h3>
        <div className="mt-4 space-y-3">
          {items.map((i) => {
            const fp = i.price * (1 - (i.discount_percent || 0) / 100);
            return (
              <div key={i.product_id} className="flex items-center gap-3 font-nunito">
                <img src={resolveAssetUrl(i.image_url)} alt={i.name} className="w-12 h-12 rounded-xl object-cover" />
                <span className="flex-1">{i.name} <span className="text-[#4B5563]">x{i.quantity}</span></span>
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
