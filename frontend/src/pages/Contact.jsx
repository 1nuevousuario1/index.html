import React, { useState } from "react";
import { api, formatApiErrorDetail } from "../lib/api";
import { toast } from "sonner";
import { Send, MessageCircle, Phone, MapPin, CheckCircle2 } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error("Por favor completa los campos requeridos");
      return;
    }
    setLoading(true);
    try {
      await api.post("/messages", form);
      setSent(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      toast.success("¡Mensaje enviado! Te responderemos pronto.");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Error al enviar el mensaje");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center" data-testid="contact-success">
        <div className="inline-flex w-24 h-24 bg-[#6BCB77]/15 rounded-full items-center justify-center mb-6">
          <CheckCircle2 size={56} className="text-[#6BCB77]" strokeWidth={2.5} />
        </div>
        <h1 className="font-fredoka text-4xl font-bold text-[#1F2937]">¡Mensaje enviado!</h1>
        <p className="text-[#4B5563] font-nunito mt-4 text-lg">
          Gracias por contactarnos. Te responderemos lo antes posible al correo que proporcionaste.
        </p>
        <button
          onClick={() => setSent(false)}
          className="mi-btn-primary mt-8"
          data-testid="send-another-btn"
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12" data-testid="contact-page">
      <div className="text-center mb-10">
        <div className="inline-flex w-20 h-20 bg-[#FF6B6B]/15 rounded-3xl items-center justify-center mb-4">
          <MessageCircle size={40} className="text-[#FF6B6B]" strokeWidth={2.5} />
        </div>
        <h1 className="font-fredoka text-4xl sm:text-5xl font-bold text-[#1F2937]">
          Contáctanos
        </h1>
        <p className="text-[#4B5563] font-nunito mt-3 text-lg">
          ¿Tienes preguntas? Estamos aquí para ayudarte.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Contact info */}
        <div className="space-y-4">
          <div className="mi-card p-5">
            <Phone size={24} className="text-[#6BCB77] mb-2" />
            <p className="text-xs text-[#4B5563] uppercase font-fredoka">Teléfono</p>
            <a href="tel:8971076125" className="font-fredoka text-lg font-bold text-[#4CAFEE]">
              897 107 6125
            </a>
          </div>
          <div className="mi-card p-5">
            <MapPin size={24} className="text-[#4CAFEE] mb-2" />
            <p className="text-xs text-[#4B5563] uppercase font-fredoka">Dirección</p>
            <p className="font-nunito text-sm">
              Boulevard Huizache 206, Ciudad Miguel Alemán, México, 88306
            </p>
          </div>
          <div className="mi-card p-5 bg-gradient-to-br from-[#FFD93D]/30 to-[#FF6B6B]/15">
            <p className="font-fredoka font-bold text-[#1F2937]">Horarios</p>
            <ul className="text-sm text-[#4B5563] mt-2 space-y-1 font-nunito">
              <li>Lunes a Viernes: 9:00 - 19:00</li>
              <li>Sábados: 10:00 - 18:00</li>
              <li>Domingos: 10:00 - 14:00</li>
            </ul>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 mi-card p-6 sm:p-8 space-y-4" data-testid="contact-form">
          <h2 className="font-fredoka text-2xl font-bold mb-2">Envíanos un mensaje</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-fredoka text-[#4B5563] block mb-1">Tu nombre *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="mi-input"
                placeholder="Ej. María González"
                data-testid="contact-name"
              />
            </div>
            <div>
              <label className="text-xs font-fredoka text-[#4B5563] block mb-1">Correo electrónico *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="mi-input"
                placeholder="tu@correo.com"
                data-testid="contact-email"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-fredoka text-[#4B5563] block mb-1">Teléfono (opcional)</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="mi-input"
              placeholder="(opcional)"
              data-testid="contact-phone"
            />
          </div>
          <div>
            <label className="text-xs font-fredoka text-[#4B5563] block mb-1">Asunto *</label>
            <input
              name="subject"
              value={form.subject}
              onChange={handleChange}
              required
              className="mi-input"
              placeholder="¿Sobre qué nos quieres escribir?"
              data-testid="contact-subject"
            />
          </div>
          <div>
            <label className="text-xs font-fredoka text-[#4B5563] block mb-1">Mensaje *</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              rows={6}
              className="mi-input"
              placeholder="Cuéntanos en qué podemos ayudarte..."
              data-testid="contact-message"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mi-btn-primary w-full flex items-center justify-center gap-2"
            data-testid="contact-submit"
          >
            {loading ? "Enviando..." : <><Send size={18} /> Enviar mensaje</>}
          </button>
          <p className="text-xs text-[#4B5563] text-center font-nunito">
            Al enviar, aceptas nuestro <a href="/aviso-de-privacidad" className="text-[#4CAFEE] hover:underline">Aviso de Privacidad</a>.
          </p>
        </form>
      </div>
    </div>
  );
}
