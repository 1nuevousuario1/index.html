import React from "react";
import { Heart, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#E5E7EB] mt-20" data-testid="main-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center">
            <span className="font-fredoka text-2xl font-bold text-[#4CAFEE]">Mundo</span>
            <span className="font-fredoka text-2xl font-bold text-[#FF6B6B] ml-1">Infantil</span>
          </div>
          <p className="mt-3 text-sm text-[#4B5563] font-nunito">
            Los mejores juguetes para crear recuerdos inolvidables.
          </p>
        </div>
        <div>
          <h4 className="font-fredoka font-semibold text-[#1F2937] mb-3">Tienda</h4>
          <ul className="space-y-2 text-sm text-[#4B5563] font-nunito">
            <li>Catálogo</li>
            <li>Promociones</li>
            <li>Novedades</li>
            <li>Puntos y Recompensas</li>
          </ul>
        </div>
        <div>
          <h4 className="font-fredoka font-semibold text-[#1F2937] mb-3">Ayuda</h4>
          <ul className="space-y-2 text-sm text-[#4B5563] font-nunito">
            <li>Envíos y devoluciones</li>
            <li>Preguntas frecuentes</li>
            <li>Contacto</li>
          </ul>
        </div>
        <div>
          <h4 className="font-fredoka font-semibold text-[#1F2937] mb-3">Contacto</h4>
          <ul className="space-y-2 text-sm text-[#4B5563] font-nunito">
            <li className="flex items-center gap-2"><Mail size={14} /> hola@mundoinfantil.com</li>
            <li className="flex items-center gap-2"><Phone size={14} /> +52 555 123 4567</li>
            <li className="flex items-center gap-2"><MapPin size={14} /> Ciudad de México</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#E5E7EB] py-4 text-center text-sm text-[#4B5563] font-nunito flex items-center justify-center gap-1">
        Hecho con <Heart size={14} className="text-[#FF6B6B] fill-[#FF6B6B]" /> por Mundo Infantil · 2026
      </div>
    </footer>
  );
}
