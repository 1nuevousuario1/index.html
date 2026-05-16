import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import { Users, DollarSign, ShoppingBag, Bell, LogOut, ShieldCheck, KeyRound } from "lucide-react";

export default function AdminDashboard() {
  const [report, setReport] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const loadPending = () => {
    api.get("/admin/orders/pending-count")
      .then(({ data }) => setPendingCount(data.count || 0))
      .catch(() => {});
  };

  useEffect(() => {
    api.get("/admin/reports/sales").then(({ data }) => setReport(data));
    loadPending();
    const interval = setInterval(loadPending, 30000); // refresh every 30s
    return () => clearInterval(interval);
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
        <div className="flex items-center gap-4">
          <div>
            <h1 className="font-fredoka text-4xl font-bold">Panel de Administración</h1>
            {user && (
              <p className="text-sm text-[#4B5563] font-nunito mt-1" data-testid="admin-current-user">
                Sesión: <strong>{user.name}</strong> · {user.email}
              </p>
            )}
          </div>
          <Link
            to="/admin/pedidos"
            className="relative inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FFD93D]/20 hover:bg-[#FFD93D]/35 transition border-2 border-[#FFD93D]/50"
            title={pendingCount > 0 ? `${pendingCount} pedido(s) pendiente(s)` : "Sin pedidos pendientes"}
            data-testid="pending-orders-bell"
          >
            <Bell size={22} className="text-[#8a6b00]" />
            {pendingCount > 0 && (
              <span
                className="absolute -top-1 -right-1 bg-[#FF6B6B] text-white text-xs font-bold rounded-full min-w-[22px] h-[22px] px-1 flex items-center justify-center shadow-md animate-pulse"
                data-testid="pending-orders-badge"
              >
                {pendingCount}
              </span>
            )}
          </Link>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/admin/pedidos" className="mi-btn-primary" data-testid="admin-orders-link">Pedidos</Link>
          <Link to="/admin/productos" className="mi-btn-yellow" data-testid="admin-products-link">Productos</Link>
          <Link to="/admin/clientes" className="mi-btn-red" data-testid="admin-customers-link">Clientes</Link>
          <Link to="/admin/mensajes" className="mi-btn-primary bg-[#6BCB77] hover:bg-[#5ab867]" style={{boxShadow: "0 4px 14px rgba(107, 203, 119, 0.3)"}} data-testid="admin-messages-link">Mensajes</Link>
          <Link to="/admin/cupones" className="mi-btn-yellow" data-testid="admin-coupons-link">
            🎟️ Cupones
          </Link>
          <Link to="/admin/seguridad" className="mi-btn-primary bg-[#9b59b6] hover:bg-[#8a4ba6]" style={{boxShadow: "0 4px 14px rgba(155, 89, 182, 0.3)"}} data-testid="admin-audit-link">
            <ShieldCheck size={16} className="inline -mt-1 mr-1" /> Seguridad
          </Link>
          <Link to="/admin/cambiar-contrasena" className="mi-btn-primary bg-[#34495e] hover:bg-[#2c3e50]" style={{boxShadow: "0 4px 14px rgba(52, 73, 94, 0.3)"}} data-testid="admin-password-link">
            <KeyRound size={16} className="inline -mt-1 mr-1" /> Contraseña
          </Link>
          <button
            onClick={async () => { await logout(); navigate("/admin/login"); }}
            className="mi-btn-primary bg-[#FF6B6B] hover:bg-[#e85a5a]"
            style={{boxShadow: "0 4px 14px rgba(255, 107, 107, 0.3)"}}
            data-testid="admin-logout-btn"
          >
            <LogOut size={16} className="inline -mt-1 mr-1" /> Salir
          </button>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="mt-6 p-4 rounded-2xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 flex items-center gap-3" data-testid="pending-orders-alert">
          <Bell size={20} className="text-[#FF6B6B]" />
          <p className="font-fredoka text-[#1F2937]">
            Tienes <strong className="text-[#FF6B6B]">{pendingCount}</strong> pedido(s) pagado(s) por procesar.
          </p>
          <Link to="/admin/pedidos" className="ml-auto mi-btn-red text-sm">Ver pedidos</Link>
        </div>
      )}

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
