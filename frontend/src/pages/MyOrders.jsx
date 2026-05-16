import React, { useEffect, useState } from "react";
import { api, resolveAssetUrl } from "../lib/api";
import { Package, Clock, CheckCircle2, Truck } from "lucide-react";

const STATUS_ES = {
  pending: { label: "Pendiente de pago", color: "#FFD93D", icon: Clock },
  processing: { label: "En preparación", color: "#4CAFEE", icon: Package },
  shipped: { label: "Enviado", color: "#6BCB77", icon: Truck },
  delivered: { label: "Entregado", color: "#6BCB77", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "#FF6B6B", icon: Clock },
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders/mine").then(({ data }) => { setOrders(data); setLoading(false); });
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10" data-testid="my-orders-page">
      <h1 className="font-fredoka text-4xl font-bold">Mis pedidos</h1>
      {loading ? (
        <p className="mt-8 font-nunito text-[#4B5563]">Cargando...</p>
      ) : orders.length === 0 ? (
        <p className="mt-8 font-nunito text-[#4B5563]">Aún no tienes pedidos.</p>
      ) : (
        <div className="space-y-4 mt-8">
          {orders.map((o) => {
            const s = STATUS_ES[o.status] || STATUS_ES.pending;
            const Icon = s.icon;
            return (
              <div key={o.id} className="mi-card p-6" data-testid={`order-${o.id}`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-fredoka font-bold">Pedido #{o.id.slice(0, 8)}</p>
                    <p className="text-sm text-[#4B5563] font-nunito">
                      {new Date(o.created_at).toLocaleString("es-MX")}
                    </p>
                  </div>
                  <span
                    className="mi-badge"
                    style={{ background: `${s.color}22`, color: s.color }}
                  >
                    <Icon size={14} /> {s.label}
                  </span>
                  <div className="font-fredoka text-xl font-bold text-[#4CAFEE]">
                    ${o.total.toFixed(2)}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {o.items.map((it, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <img src={resolveAssetUrl(it.image_url)} alt={it.name} className="w-14 h-14 rounded-xl object-cover" />
                      <div>
                        <p className="font-fredoka font-semibold text-sm">{it.name}</p>
                        <p className="text-xs text-[#4B5563]">x{it.quantity} · ${it.line_total.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {o.payment_status === "paid" && (
                  <p className="mt-3 text-sm text-[#6BCB77] font-fredoka">
                    ✅ Pago confirmado
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
