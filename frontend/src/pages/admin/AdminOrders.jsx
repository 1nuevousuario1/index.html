import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);

  const load = () => api.get("/admin/orders").then(({ data }) => setOrders(data));
  useEffect(() => { load(); }, []);

  const changeStatus = async (id, status) => {
    try {
      await api.put(`/admin/orders/${id}/status`, null, { params: { status } });
      toast.success("Estado actualizado");
      load();
    } catch (e) { toast.error("Error"); }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10" data-testid="admin-orders-page">
      <h1 className="font-fredoka text-4xl font-bold">Gestión de pedidos</h1>
      <div className="mi-card mt-6 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#F9F9F9] font-fredoka">
            <tr>
              <th className="p-4">Pedido</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Total</th>
              <th className="p-4">Pago</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Fecha</th>
            </tr>
          </thead>
          <tbody className="font-nunito">
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-[#E5E7EB]" data-testid={`admin-order-${o.id}`}>
                <td className="p-4 font-mono text-xs">#{o.id.slice(0, 8)}</td>
                <td className="p-4">{o.user_email}</td>
                <td className="p-4 font-semibold text-[#4CAFEE]">${o.total.toFixed(2)}</td>
                <td className="p-4">
                  <span className={`mi-badge ${o.payment_status === "paid" ? "bg-[#6BCB77]/20 text-[#3a8a46]" : "bg-[#FFD93D]/20 text-[#8a6b00]"}`}>
                    {o.payment_status}
                  </span>
                </td>
                <td className="p-4">
                  <select
                    className="mi-input py-1"
                    value={o.status}
                    onChange={(e) => changeStatus(o.id, e.target.value)}
                    data-testid={`status-select-${o.id}`}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="p-4 text-sm text-[#4B5563]">{new Date(o.created_at).toLocaleDateString("es-MX")}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-[#4B5563]">Sin pedidos aún</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
