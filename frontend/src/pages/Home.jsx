import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import ProductCard from "../components/ProductCard";
import { Link } from "react-router-dom";
import { Truck, Shield, Gift, Sparkles, Award, Star } from "lucide-react";

export default function Home() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.get("/products", { params: { featured: true } }).then(({ data }) => setFeatured(data));
  }, []);

  return (
    <div data-testid="home-page">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://customer-assets.emergentagent.com/job_jugueteria-pro/artifacts/76svodo9_BACKGROUND%20MUNDO%20INFANTIL.jpg)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-black/10" />
        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="text-center md:text-left order-2 md:order-1">
            <div className="inline-flex items-center gap-2 bg-[#FFD93D] text-[#1F2937] px-4 py-1.5 rounded-full font-fredoka text-sm mb-6 shadow-md">
              <Sparkles size={16} /> Nueva colección 2026
            </div>
            <h1 className="font-fredoka text-4xl sm:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg leading-tight">
              Encuentra los mejores juguetes para <span className="text-[#FFD93D]">todas las edades</span>
            </h1>
            <p className="mt-5 text-lg text-white/95 font-nunito drop-shadow">
              Diversión garantizada · Envío rápido · Puntos en cada compra
            </p>
            <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-3">
              <Link to="/catalogo" className="mi-btn-yellow" data-testid="explore-catalog-btn">
                Explorar Catálogo
              </Link>
              <Link to="/recompensas" className="mi-btn-red">
                <Gift size={16} className="inline mr-1" /> Gana puntos
              </Link>
            </div>
          </div>
          <div className="order-1 md:order-2 flex justify-center">
            <img
              src="https://customer-assets.emergentagent.com/job_jugueteria-pro/artifacts/y7hcnpi7_Mundo%20Infantil.jpg"
              alt="Mundo Infantil"
              className="w-full max-w-sm md:max-w-md rounded-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fade-up ring-8 ring-white/30"
              data-testid="hero-logo"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { icon: Truck, color: "#4CAFEE", title: "Envío rápido", desc: "Entregas en 24-48 hrs" },
          { icon: Shield, color: "#6BCB77", title: "Juguetes seguros", desc: "Certificados y probados" },
          { icon: Star, color: "#FFD93D", title: "Gana recompensas", desc: "1 punto por cada $1" },
        ].map((f, i) => (
          <div key={i} className="mi-card p-6 flex items-start gap-4" data-testid={`feature-${i}`}>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: `${f.color}22` }}
            >
              <f.icon size={24} color={f.color} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-fredoka text-lg font-semibold text-[#1F2937]">{f.title}</h3>
              <p className="text-sm text-[#4B5563] font-nunito">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-fredoka text-3xl sm:text-4xl font-bold text-[#1F2937]">
              Juguetes Destacados
            </h2>
            <p className="text-[#4B5563] font-nunito mt-1">Los favoritos de esta semana</p>
          </div>
          <Link to="/catalogo" className="hidden sm:inline font-fredoka text-[#4CAFEE] hover:underline" data-testid="see-all-link">
            Ver todos →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.slice(0, 8).map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* Promo bento */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 rounded-3xl p-10 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #4CAFEE, #3B9AD0)" }}>
            <h3 className="font-fredoka text-3xl font-bold">¡Promoción del mes!</h3>
            <p className="mt-2 font-nunito text-white/90">Hasta 20% de descuento en peluches y sets de arte</p>
            <Link to="/catalogo" className="mi-btn-yellow inline-block mt-6">Comprar ahora</Link>
            <Sparkles className="absolute right-8 top-8 opacity-30" size={80} />
          </div>
          <div className="rounded-3xl p-8 text-white" style={{ background: "linear-gradient(135deg, #FF6B6B, #FF9E6B)" }}>
            <Award size={40} className="mb-3" />
            <h3 className="font-fredoka text-2xl font-bold">Club Mundo Infantil</h3>
            <p className="mt-2 font-nunito text-white/90 text-sm">
              Niveles Bronce, Plata y Oro con beneficios exclusivos.
            </p>
            <Link to="/recompensas" className="mi-btn-yellow inline-block mt-5 text-sm">
              Conoce más
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
