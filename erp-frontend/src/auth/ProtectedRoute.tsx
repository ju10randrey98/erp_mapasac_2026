import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { token, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ padding: 24 }}>Cargando...</div>;
  if (!token) return <Navigate to="/login" replace />;
  if (!user) return <Navigate to="/login" replace />;

  const isChangePassword = location.pathname === "/change-password";

  // Si debe cambiar contraseña y NO está en /change-password → lo mandamos ahí
  if (user.must_change_password && !isChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  // Si YA NO debe cambiar contraseña pero sigue en /change-password → lo mandamos al dashboard
  if (!user.must_change_password && isChangePassword) {
    return <Navigate to="/" replace />;
  }

  return children;
}