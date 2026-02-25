import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequirePermission({
  perm,
  children,
}: {
  perm: string;
  children: JSX.Element;
}) {
  const { hasPermission, loading } = useAuth();

  if (loading) return <div style={{ padding: 24 }}>Cargando...</div>;

  if (!hasPermission(perm)) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Acceso denegado</h2>
        <p style={{ opacity: 0.8 }}>
          No tienes permiso: <b>{perm}</b>
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return children;
}