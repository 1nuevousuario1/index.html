import React from "react";
import { useAuth } from "../lib/AuthContext";
import { Star, Award, Gift, Crown } from "lucide-react";

const TIERS = [
  { name: "Bronce", min: 0, max: 99, color: "#FF6B6B", icon: Award },
  { name: "Plata", min: 100, max: 499, color: "#4CAFEE", icon: Star },
  { name: "Oro", min: 500, max: null, color: "#FFD93D", icon: Crown },
];

export default function Rewards() {
  const { user } = useAuth();
  const points = user?.points || 0;
  const currentTier = TIERS.find((t) => points >= t.min && (t.max === null || points <= t.max));

  const nextTier = TIERS.find((t) => t.min > points);
  const progress = nextTier
    ? Math.min(100, ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100)
    : 100;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10" data-testid="rewards-page">
      <h1 className="font-fredoka text-4xl font-bold text-center">Programa de Recompensas</h1>
      <p className="text-center text-[#4B5563] font-nunito mt-2">
        Gana 1 punto por cada $1 gastado y sube de nivel para obtener beneficios.
      </p>

      {user ? (
        <div className="mi-card p-8 mt-8" data-testid="user-tier-card">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm font-nunito text-[#4B5563]">Tu nivel actual</p>
              <h2 className="font-fredoka text-3xl font-bold" style={{ color: currentTier.color }}>
                {currentTier.name}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-sm font-nunito text-[#4B5563]">Tus puntos</p>
              <p className="font-fredoka text-4xl font-bold text-[#FFD93D]">
                <Star className="inline mr-1 fill-[#FFD93D]" /> {points}
              </p>
            </div>
          </div>
          {nextTier ? (
            <>
              <div className="mt-6">
                <div className="flex justify-between font-nunito text-sm">
                  <span>{currentTier.name}</span>
                  <span>{nextTier.name} ({nextTier.min} pts)</span>
                </div>
                <div className="mt-2 h-3 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier.color})` }}
                  />
                </div>
                <p className="mt-2 text-sm text-[#4B5563] font-nunito">
                  Te faltan {nextTier.min - points} puntos para alcanzar <strong>{nextTier.name}</strong>
                </p>
              </div>
            </>
          ) : (
            <p className="mt-4 font-fredoka text-[#FFD93D]">¡Felicidades! Eres nuestro cliente Oro 👑</p>
          )}
        </div>
      ) : (
        <div className="mi-card p-8 mt-8 text-center">
          <Gift size={48} className="mx-auto text-[#FF6B6B]" />
          <p className="font-fredoka text-xl mt-3">Crea tu cuenta para comenzar a ganar puntos</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {TIERS.map((t) => {
          const Icon = t.icon;
          const isCurrent = user && currentTier?.name === t.name;
          return (
            <div key={t.name} className={`mi-card p-6 ${isCurrent ? "ring-4" : ""}`} style={isCurrent ? { "--tw-ring-color": t.color, boxShadow: `0 0 0 4px ${t.color}44` } : {}}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${t.color}22` }}>
                <Icon size={28} color={t.color} strokeWidth={2.5} />
              </div>
              <h3 className="font-fredoka text-2xl font-bold mt-4" style={{ color: t.color }}>{t.name}</h3>
              <p className="text-sm font-nunito text-[#4B5563]">
                {t.max !== null ? `${t.min} - ${t.max} puntos` : `${t.min}+ puntos`}
              </p>
              <ul className="mt-4 space-y-1 text-sm font-nunito text-[#1F2937]">
                {t.name === "Bronce" && <>
                  <li>• 1 punto por cada $1</li>
                  <li>• Ofertas exclusivas</li>
                </>}
                {t.name === "Plata" && <>
                  <li>• 5% de descuento permanente</li>
                  <li>• Envíos prioritarios</li>
                  <li>• Ofertas exclusivas</li>
                </>}
                {t.name === "Oro" && <>
                  <li>• 10% de descuento permanente</li>
                  <li>• Envío express gratis</li>
                  <li>• Regalo de cumpleaños</li>
                  <li>• Preventa de novedades</li>
                </>}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
