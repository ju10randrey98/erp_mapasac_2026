import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

type LayoutCtx = {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
};

const LayoutContext = createContext<LayoutCtx | null>(null);

const STORAGE_KEY = "erp_sidebar_collapsed";

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "true"; // default: false
  });

  const toggleSidebar = () => setSidebarCollapsed((v) => !v);

  // ✅ guardar cada vez que cambie
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const value = useMemo(
    () => ({ sidebarCollapsed, toggleSidebar, setSidebarCollapsed }),
    [sidebarCollapsed]
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout must be used inside LayoutProvider");
  return ctx;
}