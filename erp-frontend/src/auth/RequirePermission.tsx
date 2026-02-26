import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

type Props = {
  anyOf: string[]; // permisos requeridos (OR)
  children: ReactNode;
  redirectTo?: string; // por defecto "/forbidden"
};

export default function RequirePermission({
  anyOf,
  children,
  redirectTo = "/forbidden",
}: Props) {
  const { user, loading, hasAnyPermission } = useAuth();

  if (loading) return null;

  // seguridad extra
  if (!user) return <Navigate to="/login" replace />;

  // ADMIN bypass recomendado
  if (user.roles?.includes("ADMIN")) return <>{children}</>;

  const allowed = hasAnyPermission(anyOf);
  if (!allowed) return <Navigate to={redirectTo} replace />;

  return <>{children}</>;
}