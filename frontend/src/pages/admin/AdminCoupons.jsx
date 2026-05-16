import React, { useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "../../lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Ticket, X } from "lucide-react";

const emptyForm = {
  code: "",
  description: "",
  discount_type: "percent",
  discount_value: 10,
  min_purchase: "",
  expires_at: "",
  usage_limit: "",
  active: true,
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/coupons");
      setCoupons(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const set = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (c) => {
    setForm({
      code: c.code,
      description: c.description || "",
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      min_purchase: c.min_purchase ?? "",
      expires_at: c.expires_at ? c.expires_at.slice(0, 16) : "",
      usage_limit: c.usage_limit ?? "",
      active: c.active,
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || null,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_purchase: form.min_purchase === "" ? null : Number(form.min_purchase),
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        usage_limit: form.usage_limit === "" ? null : Number(form.usage_limit),
        active: form.active,
      };
      if (editingId) {
        await api.put(`/admin/coupons/${editingId}`, body);
        toast.success("Cupón actualizado");
      } else {
        await api.post("/admin/coupons", body);
        toast.success("Cupón creado");
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id, code) => {
    if (!window.confirm(`¿Eliminar el cupón ${code}? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      toast.success("Cupón eliminado");
      load();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10" data-testid="admin-coupons-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Ticket size={32} className="text-[#FFD93D]" />
          <h1 className="font-fredoka text-4xl font-bold">Cupones y descuentos</h1>
        </div>
        <button onClick={openCreate} className="mi-btn-primary" data-testid="open-create-coupon">
          <Plus size={18} className="inline -mt-1 mr-1" /> Nuevo cupón
        </button>
      </div>
      <p className="text-[#4B5563] font-nunito mt-1">
        Los cupones se aplican solo a productos sin oferta activa. El cliente lo escribe manualmente en el checkout.
      </p>

      <div className="mi-card mt-6 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#F9F9F9] font-fredoka">
            <tr>
              <th className="p-4">Código</th>
              <th className="p-4">Descuento</th>
              <th className="p-4">Mín. compra</th>
              <th className="p-4">Usos</th>
              <th className="p-4">Expira</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="font-nunito">
            {loading && <tr><td colSpan={7} className="p-8 text-center text-[#4B5563]">Cargando...</td></tr>}
            {!loading && coupons.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-[#4B5563]">Aún no hay cupones. Crea uno con el botón de arriba.</td></tr>}
            {coupons.map((c) => (
              <tr key={c.id} className="border-t border-[#E5E7EB]" data-testid={`coupon-row-${c.code}`}>
                <td className="p-4">
                  <span className="font-fredoka font-bold text-[#4CAFEE]">{c.code}</span>
                  {c.description && <div className="text-xs text-[#4B5563]">{c.description}</div>}
                </td>
                <td className="p-4">
                  {c.discount_type === "percent" ? `${c.discount_value}%` : `$${c.discount_value.toFixed(2)}`}
                </td>
                <td className="p-4 text-sm">{c.min_purchase ? `$${c.min_purchase.toFixed(2)}` : "—"}</td>
                <td className="p-4 text-sm">
                  {c.times_used}{c.usage_limit ? ` / ${c.usage_limit}` : ""}
                </td>
                <td className="p-4 text-sm">
                  {c.expires_at ? new Date(c.expires_at).toLocaleDateString("es-MX") : "Sin expiración"}
                </td>
                <td className="p-4">
                  {c.active ? (
                    <span className="mi-badge bg-[#6BCB77]/20 text-[#3a8a46]">Activo</span>
                  ) : (
                    <span className="mi-badge bg-[#FF6B6B]/20 text-[#a13434]">Inactivo</span>
                  )}
                </td>
                <td className="p-4">
                  <button onClick={() => openEdit(c)} className="p-2 text-[#4CAFEE] hover:bg-[#4CAFEE]/10 rounded-full" data-testid={`edit-coupon-${c.code}`}>
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => remove(c.id, c.code)} className="p-2 text-[#FF6B6B] hover:bg-[#FF6B6B]/10 rounded-full" data-testid={`delete-coupon-${c.code}`}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="mi-card p-8 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} data-testid="coupon-form">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-fredoka text-2xl font-bold">{editingId ? "Editar cupón" : "Nuevo cupón"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-[#FF6B6B]/10 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-fredoka mb-1">Código (sin espacios)</label>
                <input className="mi-input uppercase" required maxLength={40} value={form.code}
                  onChange={set("code")} placeholder="EJ: BIENVENIDA10" data-testid="coupon-code-input" />
              </div>
              <div>
                <label className="block text-sm font-fredoka mb-1">Descripción (opcional)</label>
                <input className="mi-input" maxLength={200} value={form.description}
                  onChange={set("description")} placeholder="Promoción de bienvenida" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-fredoka mb-1">Tipo</label>
                  <select className="mi-input" value={form.discount_type} onChange={set("discount_type")} data-testid="coupon-type">
                    <option value="percent">Porcentaje (%)</option>
                    <option value="fixed">Monto fijo ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-fredoka mb-1">Valor</label>
                  <input type="number" step="0.01" min="0.01" className="mi-input" required value={form.discount_value}
                    onChange={set("discount_value")} data-testid="coupon-value" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-fredoka mb-1">Compra mínima (opcional)</label>
                <input type="number" step="0.01" min="0" className="mi-input" value={form.min_purchase}
                  onChange={set("min_purchase")} placeholder="Ej: 500" />
              </div>
              <div>
                <label className="block text-sm font-fredoka mb-1">Fecha de expiración (opcional)</label>
                <input type="datetime-local" className="mi-input" value={form.expires_at} onChange={set("expires_at")} />
              </div>
              <div>
                <label className="block text-sm font-fredoka mb-1">Límite de usos (opcional)</label>
                <input type="number" step="1" min="1" className="mi-input" value={form.usage_limit}
                  onChange={set("usage_limit")} placeholder="Ej: 100" />
              </div>
              <label className="flex items-center gap-2 font-nunito">
                <input type="checkbox" checked={form.active} onChange={set("active")} className="w-4 h-4" />
                Activo
              </label>
              <button type="submit" disabled={submitting} className="mi-btn-primary w-full" data-testid="submit-coupon">
                {submitting ? "Guardando..." : editingId ? "Guardar cambios" : "Crear cupón"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
