import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  useEffect(() => { api.get("/admin/customers").then(({ data }) => setCustomers(data)); }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10" data-testid="admin-customers-page">
      <h1 className="font-fredoka text-4xl font-bold">Clientes</h1>
      <p className="text-[#4B5563] font-nunito mt-1">Lista de clientes que han comprado en la tienda (compras como invitado).</p>
      <div className="mi-card mt-6 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#F9F9F9] font-fredoka">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">Email</th>
              <th className="p-4">Teléfono</th>
              <th className="p-4">Pedidos</th>
              <th className="p-4">Total comprado</th>
              <th className="p-4">Último pedido</th>
            </tr>
          </thead>
          <tbody className="font-nunito">
            {customers.map((c) => (
              <tr key={c.email} className="border-t border-[#E5E7EB]" data-testid={`customer-${c.email}`}>
                <td className="p-4 font-semibold">{c.name || "—"}</td>
                <td className="p-4">{c.email}</td>
                <td className="p-4">{c.phone || "—"}</td>
                <td className="p-4">{c.orders_count}</td>
                <td className="p-4 font-semibold text-[#4CAFEE]">${(c.total_spent || 0).toFixed(2)}</td>
                <td className="p-4 text-sm text-[#4B5563]">
                  {c.last_order_at ? new Date(c.last_order_at).toLocaleDateString("es-MX") : "—"}
                </td>
              </tr>
            ))}
            {customers.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-[#4B5563]">Sin clientes</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
