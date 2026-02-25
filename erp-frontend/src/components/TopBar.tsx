import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useLayout } from "../layout/LayoutContext";

export default function TopBar() {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useLayout();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header
      style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        borderBottom: "1px solid #333",
        background: "#0f0f0f",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* ☰ Botón hamburguesa */}
        <button
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            border: "1px solid #2b2b2b",
            background: "transparent",
            color: "white",
            cursor: "pointer",
            fontSize: 18,
            display: "grid",
            placeItems: "center",
          }}
        >
          ☰
        </button>

        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <div style={{ fontWeight: 700, letterSpacing: 0.4 }}>ERP</div>
          <div style={{ opacity: 0.7, fontSize: 13 }}>Panel</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {user?.username ?? "Usuario"}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {user?.email ?? ""}
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #555",
            background: "transparent",
            color: "white",
            cursor: "pointer",
          }}
        >
          Salir
        </button>
      </div>
    </header>
  );
}