import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  useEffect(() => { api.get("/admin/customers").then(({ data }) => setCustomers(data)); }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10" data-testid="admin-customers-page">
      <h1 className="font-fredoka text-4xl font-bold">Clientes</h1>
      <div className="mi-card mt-6 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#F9F9F9] font-fredoka">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">Email</th>
              <th className="p-4">Puntos</th>
              <th className="p-4">Nivel</th>
            </tr>
          </thead>
          <tbody className="font-nunito">
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-[#E5E7EB]">
                <td className="p-4">{c.name}</td>
                <td className="p-4">{c.email}</td>
                <td className="p-4 font-fredoka font-bold text-[#FFD93D]">{c.points || 0}</td>
                <td className="p-4"><span className="mi-badge bg-[#4CAFEE]/20 text-[#3B9AD0]">{c.tier}</span></td>
              </tr>
            ))}
            {customers.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-[#4B5563]">Sin clientes</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
