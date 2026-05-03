import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingCart, User, LogOut, Star, Package, BarChart3, Shapes } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { useCart } from "../lib/CartContext";

export default function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  return (
    <header
      className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#E5E7EB]"
      data-testid="main-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
          <div className="flex items-center">
            <span className="font-fredoka text-3xl font-bold text-[#4CAFEE]">Mundo</span>
            <span className="font-fredoka text-3xl font-bold text-[#FF6B6B] ml-1">Infantil</span>
            <Shapes className="ml-2 text-[#FFD93D]" size={28} strokeWidth={2.5} />
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 font-fredoka text-[#1F2937]">
          <NavLink to="/" className={({isActive}) => `hover:text-[#4CAFEE] transition ${isActive ? "text-[#4CAFEE]" : ""}`} end data-testid="nav-home">Inicio</NavLink>
          <NavLink to="/catalogo" className={({isActive}) => `hover:text-[#4CAFEE] transition ${isActive ? "text-[#4CAFEE]" : ""}`} data-testid="nav-catalog">Catálogo</NavLink>
          <NavLink to="/recompensas" className={({isActive}) => `hover:text-[#4CAFEE] transition ${isActive ? "text-[#4CAFEE]" : ""}`} data-testid="nav-rewards">Recompensas</NavLink>
          {user && user.role === "admin" && (
            <NavLink to="/admin" className={({isActive}) => `hover:text-[#4CAFEE] transition ${isActive ? "text-[#4CAFEE]" : ""}`} data-testid="nav-admin">Admin</NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          {user && user.role && (
            <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FFD93D]/25 border border-[#FFD93D]" data-testid="user-points">
              <Star size={16} className="text-[#E6A800] fill-[#FFD93D]" />
              <span className="font-fredoka text-sm font-semibold text-[#1F2937]">{user.points} pts</span>
            </div>
          )}
          <Link to="/carrito" className="relative p-2 rounded-full hover:bg-[#4CAFEE]/10 transition" data-testid="cart-link">
            <ShoppingCart size={22} className="text-[#1F2937]" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FF6B6B] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" data-testid="cart-count">
                {count}
              </span>
            )}
          </Link>
          {user && user.role ? (
            <div className="flex items-center gap-2">
              <Link to="/mis-pedidos" className="hidden sm:flex items-center gap-1 text-sm font-fredoka hover:text-[#4CAFEE]" data-testid="my-orders-link">
                <Package size={18} /> <span className="hidden lg:inline">Mis pedidos</span>
              </Link>
              <button onClick={async () => { await logout(); navigate("/"); }} className="p-2 rounded-full hover:bg-[#FF6B6B]/10 transition" title="Cerrar sesión" data-testid="logout-btn">
                <LogOut size={20} className="text-[#FF6B6B]" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="mi-btn-primary text-sm" data-testid="login-link">
              <User size={16} className="inline mr-1" /> Ingresar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
