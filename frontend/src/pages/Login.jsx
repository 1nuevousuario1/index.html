import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get("redirect") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) { toast.success("¡Bienvenido!"); navigate(redirect); }
    else toast.error(res.error);
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16" data-testid="login-page">
      <div className="mi-card p-8">
        <h1 className="font-fredoka text-3xl font-bold text-center">Bienvenido</h1>
        <p className="text-center text-[#4B5563] font-nunito mt-1">Inicia sesión para continuar</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            type="email" placeholder="tu@email.com" required
            className="mi-input" value={email}
            onChange={(e) => setEmail(e.target.value)} data-testid="login-email"
          />
          <input
            type="password" placeholder="Contraseña" required
            className="mi-input" value={password}
            onChange={(e) => setPassword(e.target.value)} data-testid="login-password"
          />
          <button type="submit" disabled={loading} className="mi-btn-primary w-full" data-testid="login-submit">
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>
        <p className="text-center mt-6 font-nunito text-sm">
          ¿No tienes cuenta? <Link to="/registro" className="text-[#4CAFEE] font-semibold" data-testid="register-link">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
