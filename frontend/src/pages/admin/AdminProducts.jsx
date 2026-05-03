import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, X } from "lucide-react";

const EMPTY = { name: "", description: "", price: 0, image_url: "", category: "Peluches", age_range: "0-3", stock: 100, discount_percent: 0, featured: false };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = () => api.get("/products").then(({ data }) => setProducts(data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const payload = {
        ...editing,
        price: parseFloat(editing.price),
        stock: parseInt(editing.stock),
        discount_percent: parseInt(editing.discount_percent),
      };
      if (editing.id) await api.put(`/products/${editing.id}`, payload);
      else await api.post("/products", payload);
      toast.success("Guardado");
      setEditing(null);
      load();
    } catch (e) { toast.error("Error al guardar"); }
  };

  const remove = async (id) => {
    if (!window.confirm("¿Eliminar producto?")) return;
    await api.delete(`/products/${id}`);
    toast.success("Eliminado");
    load();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10" data-testid="admin-products-page">
      <div className="flex justify-between items-center">
        <h1 className="font-fredoka text-4xl font-bold">Gestión de productos</h1>
        <button className="mi-btn-primary" onClick={() => setEditing({ ...EMPTY })} data-testid="new-product-btn">
          <Plus size={16} className="inline mr-1" /> Nuevo
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {products.map((p) => (
          <div key={p.id} className="mi-card" data-testid={`admin-product-${p.id}`}>
            <img src={p.image_url} alt={p.name} className="w-full aspect-square object-cover" />
            <div className="p-4">
              <h3 className="font-fredoka font-semibold line-clamp-1">{p.name}</h3>
              <p className="text-[#4CAFEE] font-fredoka font-bold">${p.price.toFixed(2)}</p>
              <p className="text-xs text-[#4B5563]">Stock: {p.stock}</p>
              <div className="flex gap-2 mt-3">
                <button className="flex-1 p-2 rounded-full bg-[#4CAFEE]/10 text-[#4CAFEE]" onClick={() => setEditing({ ...p })} data-testid={`edit-${p.id}`}>
                  <Edit2 size={16} className="inline" />
                </button>
                <button className="flex-1 p-2 rounded-full bg-[#FF6B6B]/10 text-[#FF6B6B]" onClick={() => remove(p.id)} data-testid={`delete-${p.id}`}>
                  <Trash2 size={16} className="inline" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="mi-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-fredoka text-2xl font-bold">{editing.id ? "Editar" : "Nuevo"} producto</h2>
              <button onClick={() => setEditing(null)}><X /></button>
            </div>
            <div className="space-y-3">
              <input className="mi-input" placeholder="Nombre" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              <textarea className="mi-input" placeholder="Descripción" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              <input className="mi-input" placeholder="URL imagen" value={editing.image_url} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input className="mi-input" type="number" step="0.01" placeholder="Precio" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} />
                <input className="mi-input" type="number" placeholder="Stock" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: e.target.value })} />
                <input className="mi-input" placeholder="Categoría" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
                <select className="mi-input" value={editing.age_range} onChange={(e) => setEditing({ ...editing, age_range: e.target.value })}>
                  <option>0-3</option><option>4-7</option><option>8+</option>
                </select>
                <input className="mi-input" type="number" placeholder="Descuento %" value={editing.discount_percent} onChange={(e) => setEditing({ ...editing, discount_percent: e.target.value })} />
                <label className="flex items-center gap-2 font-fredoka">
                  <input type="checkbox" checked={editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} /> Destacado
                </label>
              </div>
              <button className="mi-btn-primary w-full" onClick={save} data-testid="save-product-btn">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
