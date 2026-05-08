import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { Mail, MailOpen, Trash2, Phone, Clock, User, X } from "lucide-react";

export default function AdminMessages() {
  const [data, setData] = useState({ messages: [], unread_count: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get("/admin/messages");
      setData(res);
    } catch (e) {
      toast.error("Error al cargar mensajes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/admin/messages/${id}/read`);
      load();
    } catch {}
  };

  const remove = async (id) => {
    if (!window.confirm("¿Eliminar este mensaje? No se puede deshacer.")) return;
    try {
      await api.delete(`/admin/messages/${id}`);
      toast.success("Mensaje eliminado");
      if (selected?.id === id) setSelected(null);
      load();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const openMessage = (msg) => {
    setSelected(msg);
    if (!msg.is_read) markRead(msg.id);
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString("es-MX", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return iso; }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10" data-testid="admin-messages-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-fredoka text-4xl font-bold flex items-center gap-3">
            Mensajes recibidos
            {data.unread_count > 0 && (
              <span className="bg-[#FF6B6B] text-white text-sm px-3 py-1 rounded-full" data-testid="unread-badge">
                {data.unread_count} sin leer
              </span>
            )}
          </h1>
          <p className="text-[#4B5563] font-nunito mt-1">
            {data.messages.length} mensaje{data.messages.length !== 1 ? "s" : ""} en total
          </p>
        </div>
        <button onClick={load} className="mi-btn-yellow text-sm" data-testid="refresh-btn">
          🔄 Actualizar
        </button>
      </div>

      {loading ? (
        <p className="mt-8 text-center font-fredoka text-[#4B5563]">Cargando mensajes...</p>
      ) : data.messages.length === 0 ? (
        <div className="mt-12 text-center mi-card p-16">
          <Mail size={56} className="mx-auto text-[#4CAFEE] mb-4" />
          <p className="font-fredoka text-xl text-[#1F2937]">No hay mensajes todavía</p>
          <p className="text-[#4B5563] font-nunito mt-2">
            Cuando alguien te escriba desde la página de contacto, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          {/* Inbox list */}
          <div className="lg:col-span-1 space-y-3">
            {data.messages.map((m) => (
              <button
                key={m.id}
                onClick={() => openMessage(m)}
                className={`mi-card p-4 w-full text-left transition ${
                  selected?.id === m.id ? "ring-4 ring-[#4CAFEE]/50" : ""
                } ${!m.is_read ? "border-l-4 border-l-[#FF6B6B]" : ""}`}
                data-testid={`message-item-${m.id}`}
              >
                <div className="flex items-start gap-2">
                  {m.is_read ? (
                    <MailOpen size={18} className="text-[#4B5563] mt-1 flex-shrink-0" />
                  ) : (
                    <Mail size={18} className="text-[#FF6B6B] mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`font-fredoka truncate ${!m.is_read ? "font-bold text-[#1F2937]" : "text-[#4B5563]"}`}>
                      {m.name}
                    </p>
                    <p className="text-sm text-[#4B5563] truncate">{m.subject}</p>
                    <p className="text-xs text-[#4B5563] mt-1 flex items-center gap-1">
                      <Clock size={11} /> {formatDate(m.created_at)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Message viewer */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="mi-card p-6 sticky top-24" data-testid="message-detail">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="font-fredoka text-2xl font-bold">{selected.subject}</h2>
                    <div className="flex items-center gap-2 mt-2 flex-wrap text-sm text-[#4B5563] font-nunito">
                      <span className="flex items-center gap-1">
                        <User size={14} /> {selected.name}
                      </span>
                      <span>·</span>
                      <a href={`mailto:${selected.email}`} className="text-[#4CAFEE] hover:underline">
                        {selected.email}
                      </a>
                      {selected.phone && (
                        <>
                          <span>·</span>
                          <a href={`tel:${selected.phone}`} className="flex items-center gap-1 text-[#6BCB77]">
                            <Phone size={14} /> {selected.phone}
                          </a>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-[#4B5563] mt-2">
                      Recibido: {formatDate(selected.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-2 hover:bg-[#F9F9F9] rounded-full"
                    data-testid="close-message-btn"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="bg-[#F9F9F9] rounded-2xl p-5 my-4">
                  <p className="font-nunito text-[#1F2937] whitespace-pre-wrap leading-relaxed">
                    {selected.message}
                  </p>
                </div>

                <div className="flex gap-3 flex-wrap pt-4 border-t border-[#E5E7EB]">
                  <a
                    href={`mailto:${selected.email}?subject=Re:${encodeURIComponent(selected.subject)}`}
                    className="mi-btn-primary flex items-center gap-2"
                    data-testid="reply-email-btn"
                  >
                    <Mail size={16} /> Responder por correo
                  </a>
                  {selected.phone && (
                    <a
                      href={`tel:${selected.phone}`}
                      className="mi-btn-yellow flex items-center gap-2"
                    >
                      <Phone size={16} /> Llamar
                    </a>
                  )}
                  <button
                    onClick={() => remove(selected.id)}
                    className="mi-btn-red flex items-center gap-2"
                    data-testid="delete-message-btn"
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <div className="mi-card p-16 text-center">
                <MailOpen size={48} className="mx-auto text-[#4CAFEE] mb-4" />
                <p className="font-fredoka text-lg text-[#4B5563]">
                  Selecciona un mensaje para leerlo
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
