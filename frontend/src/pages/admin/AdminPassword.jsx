import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, formatApiErrorDetail } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

export default function AdminPassword() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.next.length < 10) {
      toast.error("La nueva contraseña debe tener al menos 10 caracteres");
      return;
    }
    if (form.next !== form.confirm) {
      toast.error("La confirmación no coincide");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/change-password", {
        current_password: form.current,
        new_password: form.next,
      });
      toast.success("Contraseña actualizada. Vuelve a iniciar sesión.");
      await logout();
      navigate("/admin/login");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-10" data-testid="admin-password-page">
      <div className="mi-card p-8">
        <div className="w-16 h-16 rounded-full bg-[#FFD93D]/20 flex items-center justify-center mx-auto">
          <KeyRound size={28} className="text-[#8a6b00]" />
        </div>
        <h1 className="font-fredoka text-3xl font-bold text-center mt-4">Cambiar contraseña</h1>
        <p className="text-center text-[#4B5563] font-nunito mt-1 text-sm">
          Usa mínimo 10 caracteres con mayúsculas, minúsculas, números y símbolos.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            type="password" placeholder="Contraseña actual" required autoComplete="current-password"
            className="mi-input" value={form.current}
            onChange={set("current")} data-testid="current-password"
          />
          <input
            type="password" placeholder="Nueva contraseña" required minLength={10} autoComplete="new-password"
            className="mi-input" value={form.next}
            onChange={set("next")} data-testid="new-password"
          />
          <input
            type="password" placeholder="Confirmar nueva contraseña" required minLength={10} autoComplete="new-password"
            className="mi-input" value={form.confirm}
            onChange={set("confirm")} data-testid="confirm-password"
          />
          <button type="submit" disabled={loading} className="mi-btn-primary w-full" data-testid="submit-password-change">
            {loading ? "Guardando..." : "Cambiar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
