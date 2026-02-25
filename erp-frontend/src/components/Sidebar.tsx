import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useLayout } from "../layout/LayoutContext";

type NavItem = {
  label: string;
  to: string;
  perms?: string[];
  icon?: string; // simple: emoji (luego lo cambiamos por icons pro)
};

export default function Sidebar() {
  const { hasAnyPermission, user } = useAuth();
  const { sidebarCollapsed } = useLayout();

  const items: NavItem[] = [
    { label: "Dashboard", to: "/", icon: "🏠" },
    { label: "Usuarios", to: "/users", perms: ["users.read"], icon: "👤" },
    { label: "Productos", to: "/products", perms: ["products.read"], icon: "📦" },
    { label: "Inventario", to: "/inventory", perms: ["inventory.read"], icon: "📊" },
  ];

  const canSee = (item: NavItem) => {
    if (!item.perms || item.perms.length === 0) return true;
    return hasAnyPermission(item.perms);
  };

  const width = sidebarCollapsed ? 76 : 240;

  return (
    <aside
      style={{
        width,
        flexShrink: 0,
        borderRight: "1px solid #2b2b2b",
        padding: 12,
        height: "calc(100vh - 56px)",
        overflowY: "auto",
        background: "#0f0f0f",
        transition: "width 160ms ease",
      }}
    >
      {/* encabezado del sidebar */}
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10, height: 18 }}>
        {!sidebarCollapsed ? user?.roles?.join(", ") ?? "" : ""}
      </div>

      <nav style={{ display: "grid", gap: 6 }}>
        {items.filter(canSee).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              padding: "10px 12px",
              borderRadius: 10,
              textDecoration: "none",
              color: "white",
              border: "1px solid #2b2b2b",
              background: isActive ? "#1c1c1c" : "transparent",
              display: "flex",
              alignItems: "center",
              gap: 10,
              justifyContent: sidebarCollapsed ? "center" : "flex-start",
            })}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <span style={{ fontSize: 18 }}>{item.icon ?? "•"}</span>
            {!sidebarCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}