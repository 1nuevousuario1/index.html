import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { toast } from "sonner";
import { Lock } from "lucide-react";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) {
      toast.success("¡Bienvenida!");
      navigate("/admin");
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16" data-testid="admin-login-page">
      <div className="mi-card p-8">
        <div className="w-16 h-16 rounded-full bg-[#4CAFEE]/15 flex items-center justify-center mx-auto">
          <Lock size={28} className="text-[#4CAFEE]" />
        </div>
        <h1 className="font-fredoka text-3xl font-bold text-center mt-4">Acceso administrador</h1>
        <p className="text-center text-[#4B5563] font-nunito mt-1">Solo para personal de la tienda</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            type="email" placeholder="admin@mundoinfantil.com" required
            className="mi-input" value={email}
            onChange={(e) => setEmail(e.target.value)} data-testid="admin-login-email"
          />
          <input
            type="password" placeholder="Contraseña" required
            className="mi-input" value={password}
            onChange={(e) => setPassword(e.target.value)} data-testid="admin-login-password"
          />
          <button type="submit" disabled={loading} className="mi-btn-primary w-full" data-testid="admin-login-submit">
            {loading ? "Ingresando..." : "Ingresar al panel"}
          </button>
        </form>
      </div>
    </div>
  );
}
