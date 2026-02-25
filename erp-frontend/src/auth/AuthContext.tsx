import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import api from "../api/axios";

type User = {
  id: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  must_change_password: boolean;
};

interface AuthContextType {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
  refreshMe: () => Promise<void>;
  hasPermission: (perm: string) => boolean;
  hasAnyPermission: (perms: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const refreshMe = async () => {
    if (!localStorage.getItem("token")) {
      setUser(null);
      return;
    }
    const res = await api.get("/auth/me");
    setUser(res.data);
  };

  useEffect(() => {
    (async () => {
      try {
        if (token) {
          await refreshMe();
        } else {
          setUser(null);
        }
      } catch {
        // si falla /me, limpiamos sesión
        logout();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const hasPermission = (perm: string) => !!user?.permissions?.includes(perm);

  const hasAnyPermission = (perms: string[]) => perms.some((p) => hasPermission(p));

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      logout,
      refreshMe,
      hasPermission,
      hasAnyPermission,
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};