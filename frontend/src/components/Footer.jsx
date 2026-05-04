import React from "react";
import { Heart, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#E5E7EB] mt-20" data-testid="main-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center">
            <span className="font-fredoka text-2xl font-bold text-[#4CAFEE]">Mundo</span>
            <span className="font-fredoka text-2xl font-bold text-[#FF6B6B] ml-1">Infantil</span>
          </div>
          <p className="mt-3 text-sm text-[#4B5563] font-nunito">
            Artículos para bebés/niños
          </p>
        </div>
        <div>
          <h4 className="font-fredoka font-semibold text-[#1F2937] mb-3">Información de contacto</h4>
          <ul className="space-y-2 text-sm text-[#4B5563] font-nunito">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 flex-shrink-0 text-[#4CAFEE]" />
              <span>Boulevard Huizache 206, Ciudad Miguel Alemán, México, 88306</span>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-fredoka font-semibold text-[#1F2937] mb-3">Celular</h4>
          <ul className="space-y-2 text-sm text-[#4B5563] font-nunito">
            <li className="flex items-center gap-2">
              <Phone size={16} className="text-[#6BCB77]" />
              <a href="tel:8971076125" className="hover:text-[#4CAFEE]">897 107 6125</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#E5E7EB] py-4 text-center text-sm text-[#4B5563] font-nunito flex items-center justify-center gap-1">
        Hecho con <Heart size={14} className="text-[#FF6B6B] fill-[#FF6B6B]" /> por Mundo Infantil · 2026
      </div>
    </footer>
  );
}
