import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../lib/CartContext";
import { api, formatApiErrorDetail, resolveAssetUrl } from "../lib/api";
import { toast } from "sonner";
import { Tag, CheckCircle2, X } from "lucide-react";

export default function Checkout() {
  const { items, subtotal } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(null); // {code, discount_amount, total, ...}
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      navigate("/carrito");
    }
  }, [items.length, navigate]);

  // If items change, drop the applied coupon (force re-validate)
  useEffect(() => {
    setCoupon(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, subtotal]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setValidating(true);
    try {
      const { data } = await api.post("/coupons/validate", {
        code: couponInput.trim(),
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      });
      setCoupon(data);
      toast.success(`Cupón ${data.code} aplicado: −$${data.discount_amount.toFixed(2)} MXN`);
    } catch (err) {
      setCoupon(null);
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setValidating(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput("");
  };

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
        coupon_code: coupon ? coupon.code : null,
      };
      const { data } = await api.post("/orders/checkout", payload);
      window.location.href = data.url;
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail) || e.message);
      setLoading(false);
    }
  };

  const finalTotal = coupon ? coupon.total : subtotal;
  const discount = coupon ? coupon.discount_amount : 0;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10" data-testid="checkout-page">
      <h1 className="font-fredoka text-4xl font-bold">Finalizar compra</h1>
      <p className="text-[#4B5563] font-nunito mt-1">Completa tus datos y procederemos al pago seguro con Stripe.</p>

      <div className="mi-card p-6 mt-8">
        <h3 className="font-fredoka text-xl font-semibold mb-4">Tus datos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-fredoka mb-1">Nombre completo</label>
            <input className="mi-input" placeholder="Ej. Ana López García" value={form.name} onChange={set("name")} data-testid="checkout-name" />
          </div>
          <div>
            <label className="block text-sm font-fredoka mb-1">Email</label>
            <input type="email" className="mi-input" placeholder="tu@email.com" value={form.email} onChange={set("email")} data-testid="checkout-email" />
          </div>
          <div>
            <label className="block text-sm font-fredoka mb-1">Teléfono</label>
            <input type="tel" className="mi-input" placeholder="Ej. 5512345678" value={form.phone} onChange={set("phone")} data-testid="checkout-phone" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-fredoka mb-1">Dirección de envío</label>
            <textarea className="mi-input min-h-[100px]" placeholder="Calle, número, colonia, ciudad, código postal, estado" value={form.address} onChange={set("address")} data-testid="checkout-address" />
          </div>
        </div>
        <div className="mt-4 p-4 bg-[#4CAFEE]/10 rounded-2xl border border-[#4CAFEE]/30">
          <p className="font-fredoka font-semibold text-sm text-[#1F2937] mb-2">🚚 Política de envío</p>
          <ul className="text-xs text-[#4B5563] font-nunito space-y-1">
            <li>📍 <strong>Misma ciudad (Ciudad Miguel Alemán)</strong>: entrega con costo de reparto local</li>
            <li>🇲🇽 <strong>Otras ciudades</strong>: envíos a toda la República Mexicana con costo de envío</li>
            <li className="text-[#6BCB77] font-semibold">💎 En compras mayores a $2,000 MXN, el envío es GRATIS</li>
          </ul>
        </div>
      </div>

      <div className="mi-card p-6 mt-6">
        <h3 className="font-fredoka text-xl font-semibold flex items-center gap-2">
          <Tag size={20} className="text-[#FFD93D]" /> ¿Tienes un cupón?
        </h3>
        {!coupon ? (
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              className="mi-input uppercase flex-1"
              placeholder="Escribe tu código"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }}
              data-testid="coupon-input"
            />
            <button onClick={applyCoupon} disabled={validating || !couponInput.trim()} className="mi-btn-yellow" data-testid="apply-coupon">
              {validating ? "Validando..." : "Aplicar"}
            </button>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between gap-3 p-3 bg-[#6BCB77]/15 rounded-2xl border border-[#6BCB77]/40" data-testid="coupon-applied">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} className="text-[#3a8a46]" />
              <div>
                <p className="font-fredoka font-bold text-[#1F2937]">{coupon.code}</p>
                <p className="text-xs text-[#4B5563]">
                  {coupon.description || (coupon.discount_type === "percent" ? `${coupon.discount_value}% de descuento` : `$${coupon.discount_value.toFixed(2)} de descuento`)}
                  {" · "}Ahorras ${coupon.discount_amount.toFixed(2)}
                </p>
              </div>
            </div>
            <button onClick={removeCoupon} className="p-2 text-[#FF6B6B] hover:bg-[#FF6B6B]/10 rounded-full" data-testid="remove-coupon">
              <X size={18} />
            </button>
          </div>
        )}
        <p className="text-xs text-[#4B5563] font-nunito mt-2">
          ℹ️ Los cupones aplican solo sobre productos sin oferta activa.
        </p>
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
        <div className="mt-4 pt-4 border-t space-y-2 font-nunito">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-[#6BCB77]" data-testid="discount-row">
              <span>Descuento ({coupon.code})</span>
              <span>−${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-fredoka text-xl pt-2 border-t">
            <span>Total</span>
            <span className="text-[#4CAFEE]" data-testid="checkout-total">${finalTotal.toFixed(2)}</span>
          </div>
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
