import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import { Package, Users, DollarSign, ShoppingBag } from "lucide-react";

export default function AdminDashboard() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    api.get("/admin/reports/sales").then(({ data }) => setReport(data));
  }, []);

  if (!report) return <div className="p-20 text-center font-fredoka">Cargando reportes...</div>;

  const stats = [
    { label: "Ventas totales", value: `$${report.total_sales.toFixed(2)}`, icon: DollarSign, color: "#6BCB77" },
    { label: "Pedidos pagados", value: report.total_orders, icon: ShoppingBag, color: "#4CAFEE" },
    { label: "Clientes", value: report.total_customers, icon: Users, color: "#FF6B6B" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10" data-testid="admin-dashboard-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-fredoka text-4xl font-bold">Panel de Administración</h1>
        <div className="flex gap-2 flex-wrap">
          <Link to="/admin/pedidos" className="mi-btn-primary" data-testid="admin-orders-link">Pedidos</Link>
          <Link to="/admin/productos" className="mi-btn-yellow" data-testid="admin-products-link">Productos</Link>
          <Link to="/admin/clientes" className="mi-btn-red" data-testid="admin-customers-link">Clientes</Link>
          <Link to="/admin/mensajes" className="mi-btn-primary bg-[#6BCB77] hover:bg-[#5ab867]" style={{boxShadow: "0 4px 14px rgba(107, 203, 119, 0.3)"}} data-testid="admin-messages-link">📬 Mensajes</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
        {stats.map((s, i) => (
          <div key={i} className="mi-card p-6" data-testid={`stat-${i}`}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${s.color}22` }}>
              <s.icon size={24} color={s.color} />
            </div>
            <p className="text-sm text-[#4B5563] font-nunito mt-3">{s.label}</p>
            <p className="font-fredoka text-3xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="mi-card p-6">
          <h3 className="font-fredoka text-xl font-bold">Ventas por día</h3>
          <div className="h-64 mt-4" style={{ minHeight: 256 }}>
            {report.by_day.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#4B5563] font-nunito">Aún no hay ventas registradas</div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.by_day}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" style={{ fontFamily: "Nunito", fontSize: 12 }} />
                <YAxis style={{ fontFamily: "Nunito", fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#4CAFEE" strokeWidth={3} dot={{ fill: "#4CAFEE" }} />
              </LineChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="mi-card p-6">
          <h3 className="font-fredoka text-xl font-bold">Top productos</h3>
          <div className="h-64 mt-4" style={{ minHeight: 256 }}>
            {report.top_products.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#4B5563] font-nunito">Sin datos todavía</div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.top_products}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" style={{ fontFamily: "Nunito", fontSize: 10 }} />
                <YAxis style={{ fontFamily: "Nunito", fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#FFD93D" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
