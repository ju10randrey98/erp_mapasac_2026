import { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin123*");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { username, password });
      const token: string | undefined = res.data?.access_token;

      if (!token) throw new Error("No access_token in response");

      await login(token);// tu AuthContext debe guardar en localStorage("token", token)
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("LOGIN ERROR:", err?.response?.status, err?.response?.data || err);
      alert(err?.response?.data?.message ?? "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div style={{ width: 360, padding: 24, border: "1px solid #333", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>ERP Login</h2>

        <form onSubmit={handleLogin}>
          <label style={{ display: "block", marginBottom: 6 }}>Usuario</label>
          <input
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #555" }}
            placeholder="admin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />

          <div style={{ height: 12 }} />

          <label style={{ display: "block", marginBottom: 6 }}>Contraseña</label>
          <input
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #555" }}
            type="password"
            placeholder="Ingresar Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <div style={{ height: 16 }} />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #555",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        
      </div>
    </div>
  );
}
