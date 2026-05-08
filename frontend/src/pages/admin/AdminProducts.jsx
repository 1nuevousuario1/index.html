import React, { useEffect, useRef, useState } from "react";
import { api, resolveAssetUrl } from "../../lib/api";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, X, Upload, ImageIcon } from "lucide-react";

const EMPTY = { name: "", description: "", price: 0, image_url: "", category: "Sin categoría", age_range: "Todas", stock: 100, discount_percent: 0, featured: false };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const load = () => api.get("/products").then(({ data }) => setProducts(data));
  useEffect(() => { load(); }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona un archivo de imagen válido");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen es muy grande (máximo 10MB)");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/admin/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setEditing({ ...editing, image_url: data.url });
      toast.success("Imagen subida correctamente");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al subir la imagen");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const save = async () => {
    if (!editing.name?.trim()) { toast.error("El nombre es requerido"); return; }
    if (!editing.image_url?.trim()) { toast.error("Sube una imagen primero"); return; }
    try {
      const payload = {
        ...editing,
        price: parseFloat(editing.price) || 0,
        stock: parseInt(editing.stock) || 0,
        discount_percent: parseInt(editing.discount_percent) || 0,
      };
      if (editing.id) await api.put(`/products/${editing.id}`, payload);
      else await api.post("/products", payload);
      toast.success(editing.id ? "Producto actualizado" : "Producto creado");
      setEditing(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Error al guardar");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Producto eliminado");
      load();
    } catch (e) { toast.error("Error al eliminar"); }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10" data-testid="admin-products-page">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="font-fredoka text-4xl font-bold">Gestión de productos</h1>
          <p className="text-[#4B5563] font-nunito mt-1">{products.length} productos en el catálogo</p>
        </div>
        <button className="mi-btn-primary" onClick={() => setEditing({ ...EMPTY })} data-testid="new-product-btn">
          <Plus size={16} className="inline mr-1" /> Nuevo producto
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {products.map((p) => (
          <div key={p.id} className="mi-card" data-testid={`admin-product-${p.id}`}>
            <img src={resolveAssetUrl(p.image_url)} alt={p.name} className="w-full aspect-square object-cover" />
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
              {/* Image upload section */}
              <div>
                <label className="font-fredoka font-semibold text-sm text-[#1F2937] block mb-2">Foto del producto *</label>
                {editing.image_url ? (
                  <div className="relative group">
                    <img
                      src={resolveAssetUrl(editing.image_url)}
                      alt="preview"
                      className="w-full aspect-square object-cover rounded-2xl border-2 border-[#E5E7EB]"
                    />
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, image_url: "" })}
                      className="absolute top-2 right-2 bg-[#FF6B6B] text-white p-2 rounded-full hover:scale-110 transition"
                      title="Eliminar imagen"
                      data-testid="remove-image-btn"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full aspect-square border-2 border-dashed border-[#4CAFEE] rounded-2xl flex flex-col items-center justify-center gap-3 bg-[#4CAFEE]/5 hover:bg-[#4CAFEE]/10 transition cursor-pointer disabled:opacity-50"
                    data-testid="upload-image-btn"
                  >
                    {uploading ? (
                      <>
                        <div className="w-12 h-12 border-4 border-[#4CAFEE] border-t-transparent rounded-full animate-spin" />
                        <span className="font-fredoka text-[#4CAFEE]">Subiendo...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={48} className="text-[#4CAFEE]" />
                        <div className="text-center">
                          <p className="font-fredoka font-semibold text-[#1F2937]">Subir foto del juguete</p>
                          <p className="text-xs text-[#4B5563] mt-1">JPG, PNG, WEBP · Máx 10MB</p>
                        </div>
                      </>
                    )}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  className="hidden"
                  data-testid="image-file-input"
                />
                {editing.image_url && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="mt-2 w-full py-2 px-4 rounded-full border-2 border-[#4CAFEE] text-[#4CAFEE] font-fredoka text-sm hover:bg-[#4CAFEE]/10 transition flex items-center justify-center gap-2"
                  >
                    <ImageIcon size={14} /> Cambiar foto
                  </button>
                )}
              </div>

              <input className="mi-input" placeholder="Nombre del juguete *" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} data-testid="product-name-input" />
              <textarea className="mi-input" placeholder="Descripción" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-fredoka text-[#4B5563] block mb-1">Precio (MXN)</label>
                  <input className="mi-input" type="number" step="0.01" placeholder="0.00" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} data-testid="product-price-input" />
                </div>
                <div>
                  <label className="text-xs font-fredoka text-[#4B5563] block mb-1">Stock</label>
                  <input className="mi-input" type="number" placeholder="100" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-fredoka text-[#4B5563] block mb-1">Categoría</label>
                  <input className="mi-input" placeholder="Sin categoría" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-fredoka text-[#4B5563] block mb-1">Edad</label>
                  <select className="mi-input" value={editing.age_range} onChange={(e) => setEditing({ ...editing, age_range: e.target.value })}>
                    <option value="Todas">Todas</option>
                    <option value="0-3">0-3 años</option>
                    <option value="4-7">4-7 años</option>
                    <option value="8+">8+ años</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-fredoka text-[#4B5563] block mb-1">Descuento %</label>
                  <input className="mi-input" type="number" placeholder="0" value={editing.discount_percent} onChange={(e) => setEditing({ ...editing, discount_percent: e.target.value })} />
                </div>
                <label className="flex items-center gap-2 font-fredoka cursor-pointer pt-6">
                  <input type="checkbox" className="w-5 h-5 accent-[#4CAFEE]" checked={editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} />
                  <span>⭐ Destacado</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button className="mi-btn-yellow flex-1" onClick={() => setEditing(null)}>Cancelar</button>
                <button className="mi-btn-primary flex-1" onClick={save} data-testid="save-product-btn" disabled={uploading}>
                  {editing.id ? "Guardar cambios" : "Crear producto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
