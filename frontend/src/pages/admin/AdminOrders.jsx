import React, { useEffect, useState } from "react";
import { api, resolveAssetUrl } from "../../lib/api";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Mail, Phone, MapPin, Package } from "lucide-react";

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

const STATUS_LABEL = {
  pending: "Pendiente",
  processing: "En proceso",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState({});

  const load = () => api.get("/admin/orders").then(({ data }) => setOrders(data));
  useEffect(() => { load(); }, []);

  const changeStatus = async (id, status) => {
    try {
      await api.put(`/admin/orders/${id}/status`, null, { params: { status } });
      toast.success("Estado actualizado");
      load();
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const toggle = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  return (
    <div className="max-w-7xl mx-auto px-6 py-10" data-testid="admin-orders-page">
      <h1 className="font-fredoka text-4xl font-bold">Gestión de pedidos</h1>
      <p className="text-[#4B5563] font-nunito mt-1">Haz clic en una fila para ver los datos del cliente y los productos.</p>

      <div className="mi-card mt-6 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#F9F9F9] font-fredoka">
            <tr>
              <th className="p-4 w-8"></th>
              <th className="p-4">Pedido</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Total</th>
              <th className="p-4">Pago</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Fecha</th>
            </tr>
          </thead>
          <tbody className="font-nunito">
            {orders.map((o) => {
              const isOpen = !!expanded[o.id];
              return (
                <React.Fragment key={o.id}>
                  <tr
                    className="border-t border-[#E5E7EB] cursor-pointer hover:bg-[#F9F9F9]/60"
                    data-testid={`admin-order-${o.id}`}
                    onClick={() => toggle(o.id)}
                  >
                    <td className="p-4">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </td>
                    <td className="p-4 font-mono text-xs">#{o.id.slice(0, 8)}</td>
                    <td className="p-4">
                      <div className="font-semibold text-[#1F2937]">{o.customer_name || "—"}</div>
                      <div className="text-xs text-[#4B5563]">{o.customer_email}</div>
                    </td>
                    <td className="p-4 font-semibold text-[#4CAFEE]">${o.total.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`mi-badge ${o.payment_status === "paid" ? "bg-[#6BCB77]/20 text-[#3a8a46]" : "bg-[#FFD93D]/20 text-[#8a6b00]"}`}>
                        {o.payment_status === "paid" ? "Pagado" : o.payment_status}
                      </span>
                    </td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        className="mi-input py-1"
                        value={o.status}
                        onChange={(e) => changeStatus(o.id, e.target.value)}
                        data-testid={`status-select-${o.id}`}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                    </td>
                    <td className="p-4 text-sm text-[#4B5563]">{new Date(o.created_at).toLocaleString("es-MX")}</td>
                  </tr>
                  {isOpen && (
                    <tr className="border-t border-[#E5E7EB] bg-[#F9F9F9]/40" data-testid={`admin-order-detail-${o.id}`}>
                      <td colSpan={7} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-fredoka font-semibold text-[#1F2937] mb-3">Datos del cliente</h4>
                            <ul className="space-y-2 text-sm">
                              <li className="flex items-start gap-2"><Mail size={16} className="text-[#4CAFEE] mt-0.5" /> <span data-testid={`order-email-${o.id}`}>{o.customer_email}</span></li>
                              <li className="flex items-start gap-2"><Phone size={16} className="text-[#6BCB77] mt-0.5" /> <span data-testid={`order-phone-${o.id}`}>{o.customer_phone || "—"}</span></li>
                              <li className="flex items-start gap-2"><MapPin size={16} className="text-[#FF6B6B] mt-0.5" /> <span data-testid={`order-address-${o.id}`}>{o.shipping_address}</span></li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-fredoka font-semibold text-[#1F2937] mb-3 flex items-center gap-2">
                              <Package size={18} className="text-[#FFD93D]" /> Productos
                            </h4>
                            <ul className="space-y-2">
                              {(o.items || []).map((it, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-sm">
                                  <img src={resolveAssetUrl(it.image_url)} alt={it.name} className="w-10 h-10 rounded-lg object-cover" />
                                  <span className="flex-1">{it.name} <span className="text-[#4B5563]">x{it.quantity}</span></span>
                                  <span className="font-semibold">${it.line_total.toFixed(2)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {orders.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-[#4B5563]">Sin pedidos aún</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
