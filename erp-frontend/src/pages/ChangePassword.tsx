import { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { refreshMe, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      const newToken: string | undefined = res.data?.access_token;
      if (newToken) {
        localStorage.setItem("token", newToken);
      }

      await refreshMe();
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error(
        "CHANGE PASSWORD ERROR:",
        err?.response?.status,
        err?.response?.data || err
      );
      alert(err?.response?.data?.message ?? "No se pudo cambiar la contraseña");

      if (err?.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: 420, padding: 24, border: "1px solid #333", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>Cambiar contraseña</h2>
        <p style={{ marginTop: 0, opacity: 0.8 }}>
          Debes cambiar tu contraseña antes de continuar.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginBottom: 6 }}>Contraseña actual</label>
          <input
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #555" }}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />

          <div style={{ height: 12 }} />

          <label style={{ display: "block", marginBottom: 6 }}>Nueva contraseña</label>
          <input
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #555" }}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
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
            {loading ? "Guardando..." : "Actualizar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}