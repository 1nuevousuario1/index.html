import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";

const REASON_LABEL = {
  ok: "Inicio correcto",
  invalid_credentials: "Credenciales inválidas",
  locked_out: "Bloqueado por fuerza bruta",
  wrong_current_password: "Contraseña actual incorrecta",
};

export default function AdminAuditLog() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/audit-log")
      .then(({ data }) => setRows(data))
      .finally(() => setLoading(false));
  }, []);

  const successCount = rows.filter((r) => r.success).length;
  const failedCount = rows.length - successCount;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10" data-testid="admin-audit-page">
      <div className="flex items-center gap-3">
        <ShieldCheck size={32} className="text-[#6BCB77]" />
        <h1 className="font-fredoka text-4xl font-bold">Registro de accesos</h1>
      </div>
      <p className="text-[#4B5563] font-nunito mt-1">Últimos 100 intentos de inicio de sesión al panel administrativo.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="mi-card p-4 flex items-center gap-3">
          <CheckCircle2 size={28} className="text-[#6BCB77]" />
          <div>
            <p className="text-xs text-[#4B5563] font-nunito">Accesos exitosos</p>
            <p className="font-fredoka text-2xl font-bold" data-testid="audit-success-count">{successCount}</p>
          </div>
        </div>
        <div className="mi-card p-4 flex items-center gap-3">
          <XCircle size={28} className="text-[#FF6B6B]" />
          <div>
            <p className="text-xs text-[#4B5563] font-nunito">Intentos fallidos</p>
            <p className="font-fredoka text-2xl font-bold" data-testid="audit-failed-count">{failedCount}</p>
          </div>
        </div>
        <div className="mi-card p-4 flex items-center gap-3">
          <ShieldAlert size={28} className="text-[#FFD93D]" />
          <div>
            <p className="text-xs text-[#4B5563] font-nunito">Total registrados</p>
            <p className="font-fredoka text-2xl font-bold">{rows.length}</p>
          </div>
        </div>
      </div>

      <div className="mi-card mt-6 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#F9F9F9] font-fredoka">
            <tr>
              <th className="p-4">Fecha y hora</th>
              <th className="p-4">Email intentado</th>
              <th className="p-4">IP</th>
              <th className="p-4">Resultado</th>
              <th className="p-4">Detalle</th>
            </tr>
          </thead>
          <tbody className="font-nunito">
            {loading && <tr><td colSpan={5} className="p-8 text-center text-[#4B5563]">Cargando...</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-[#4B5563]">Sin registros</td></tr>}
            {rows.map((r, idx) => (
              <tr key={idx} className="border-t border-[#E5E7EB]" data-testid={`audit-row-${idx}`}>
                <td className="p-4 text-sm">{new Date(r.created_at).toLocaleString("es-MX")}</td>
                <td className="p-4 text-sm">{r.email || "—"}</td>
                <td className="p-4 text-sm font-mono">{r.ip || "—"}</td>
                <td className="p-4">
                  {r.success ? (
                    <span className="mi-badge bg-[#6BCB77]/20 text-[#3a8a46]">Exitoso</span>
                  ) : (
                    <span className="mi-badge bg-[#FF6B6B]/20 text-[#a13434]">Fallido</span>
                  )}
                </td>
                <td className="p-4 text-sm text-[#4B5563]">{REASON_LABEL[r.reason] || r.reason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
