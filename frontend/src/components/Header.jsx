import React from "react";
import { Link, NavLink } from "react-router-dom";
import { ShoppingCart, Shapes } from "lucide-react";
import { useCart } from "../lib/CartContext";

export default function Header() {
  const { count } = useCart();

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
          <NavLink to="/contacto" className={({isActive}) => `hover:text-[#4CAFEE] transition ${isActive ? "text-[#4CAFEE]" : ""}`} data-testid="nav-contact">Contacto</NavLink>
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <Link to="/carrito" className="relative p-2 rounded-full hover:bg-[#4CAFEE]/10 transition" data-testid="cart-link">
            <ShoppingCart size={22} className="text-[#1F2937]" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FF6B6B] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" data-testid="cart-count">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
