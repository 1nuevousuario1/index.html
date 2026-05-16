import React, { useEffect, useState, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useCart } from "../lib/CartContext";
import { useAuth } from "../lib/AuthContext";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export default function CheckoutSuccess() {
  const { search } = useLocation();
  const sessionId = new URLSearchParams(search).get("session_id");
  const [status, setStatus] = useState("checking"); // checking | paid | expired | error
  const [amount, setAmount] = useState(0);
  const { clear } = useCart();
  const { refreshMe } = useAuth();
  const attemptsRef = useRef(0);
  const clearedRef = useRef(false);

  useEffect(() => {
    if (!sessionId) { setStatus("error"); return; }
    const poll = async () => {
      if (attemptsRef.current >= 10) { setStatus("error"); return; }
      attemptsRef.current += 1;
      try {
        const { data } = await api.get(`/orders/status/${sessionId}`);
        setAmount(data.amount || 0);
        if (data.payment_status === "paid") {
          setStatus("paid");
          if (!clearedRef.current) { clear(); refreshMe(); clearedRef.current = true; }
          return;
        }
        if (data.status === "expired") { setStatus("expired"); return; }
        setTimeout(poll, 2000);
      } catch {
        setTimeout(poll, 2500);
      }
    };
    poll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="max-w-xl mx-auto px-6 py-16 text-center" data-testid="checkout-success-page">
      {status === "checking" && (
        <>
          <Clock size={72} className="mx-auto text-[#4CAFEE] animate-pulse" />
          <h1 className="font-fredoka text-3xl font-bold mt-4">Verificando tu pago...</h1>
          <p className="text-[#4B5563] font-nunito mt-2">No cierres esta ventana.</p>
        </>
      )}
      {status === "paid" && (
        <>
          <CheckCircle2 size={80} className="mx-auto text-[#6BCB77]" />
          <h1 className="font-fredoka text-4xl font-bold mt-4">¡Pago exitoso!</h1>
          <p className="text-[#4B5563] font-nunito mt-2">Gracias por tu compra de ${amount.toFixed(2)} MXN</p>
          <div className="flex gap-3 justify-center mt-8">
            <Link to="/mis-pedidos" className="mi-btn-primary">Ver mis pedidos</Link>
            <Link to="/catalogo" className="mi-btn-yellow">Seguir comprando</Link>
          </div>
        </>
      )}
      {status === "expired" && (
        <>
          <XCircle size={72} className="mx-auto text-[#FF6B6B]" />
          <h1 className="font-fredoka text-3xl font-bold mt-4">Sesión expirada</h1>
          <Link to="/carrito" className="mi-btn-primary mt-6 inline-block">Volver al carrito</Link>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle size={72} className="mx-auto text-[#FF6B6B]" />
          <h1 className="font-fredoka text-3xl font-bold mt-4">No pudimos verificar el pago</h1>
          <p className="text-[#4B5563] mt-2 font-nunito">Revisa tus pedidos en un momento.</p>
          <Link to="/mis-pedidos" className="mi-btn-primary mt-6 inline-block">Mis pedidos</Link>
        </>
      )}
    </div>
  );
}
