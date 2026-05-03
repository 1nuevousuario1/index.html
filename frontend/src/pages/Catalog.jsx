import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import ProductCard from "../components/ProductCard";

const CATEGORIES = ["Todas", "Peluches", "Construcción", "Muñecas", "Vehículos", "Didácticos", "Arte", "Interactivos", "Juegos de Rol", "Bebés", "Figuras"];
const AGES = ["Todas", "0-3", "4-7", "8+"];

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [cat, setCat] = useState("Todas");
  const [age, setAge] = useState("Todas");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/products").then(({ data }) => { setProducts(data); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (cat !== "Todas" && p.category !== cat) return false;
      if (age !== "Todas" && p.age_range !== age) return false;
      if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [products, cat, age, query]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10" data-testid="catalog-page">
      <h1 className="font-fredoka text-4xl sm:text-5xl font-bold text-[#1F2937]">Catálogo de juguetes</h1>
      <p className="text-[#4B5563] font-nunito mt-2">Explora nuestra colección completa</p>

      <div className="mt-8 space-y-4">
        <input
          className="mi-input max-w-md"
          placeholder="Buscar juguete..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="search-input"
        />
        <div className="flex flex-wrap gap-2">
          <span className="font-fredoka text-sm text-[#4B5563] self-center mr-2">Categoría:</span>
          {CATEGORIES.map((c) => (
            <button key={c} className={`mi-chip ${cat === c ? "active" : ""}`} onClick={() => setCat(c)} data-testid={`filter-cat-${c}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="font-fredoka text-sm text-[#4B5563] self-center mr-2">Edad:</span>
          {AGES.map((a) => (
            <button key={a} className={`mi-chip ${age === a ? "active" : ""}`} onClick={() => setAge(a)} data-testid={`filter-age-${a}`}>
              {a === "Todas" ? a : `${a} años`}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10">
        {loading ? (
          <div className="text-center py-20 font-fredoka text-[#4B5563]">Cargando juguetes...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 font-fredoka text-[#4B5563]">No encontramos juguetes con esos filtros.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="products-grid">
            {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}
