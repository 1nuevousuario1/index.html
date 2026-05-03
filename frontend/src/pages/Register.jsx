import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { toast } from "sonner";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await register(name, email, password);
    setLoading(false);
    if (res.ok) { toast.success("¡Cuenta creada!"); navigate("/"); }
    else toast.error(res.error);
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16" data-testid="register-page">
      <div className="mi-card p-8">
        <h1 className="font-fredoka text-3xl font-bold text-center">Crear cuenta</h1>
        <p className="text-center text-[#4B5563] font-nunito mt-1">Únete y gana puntos en cada compra</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input className="mi-input" placeholder="Tu nombre" required value={name} onChange={(e) => setName(e.target.value)} data-testid="register-name" />
          <input type="email" className="mi-input" placeholder="tu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} data-testid="register-email" />
          <input type="password" className="mi-input" placeholder="Contraseña (mínimo 6)" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} data-testid="register-password" />
          <button type="submit" disabled={loading} className="mi-btn-primary w-full" data-testid="register-submit">
            {loading ? "Creando..." : "Crear cuenta"}
          </button>
        </form>
        <p className="text-center mt-6 font-nunito text-sm">
          ¿Ya tienes cuenta? <Link to="/login" className="text-[#4CAFEE] font-semibold">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
