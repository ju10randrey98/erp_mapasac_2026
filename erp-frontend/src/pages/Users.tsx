import { useEffect, useState } from "react";
import api from "../api/axios";

type Role = {
  id: number;
  name: string;
  description?: string | null;
};

type User = {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  must_change_password?: boolean;
  failed_attempts?: number;
  locked_until?: string | null;
  created_at: string;
};

type Meta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type PasswordModalState = {
  open: boolean;
  title: string;
  username?: string;
  tempPassword?: string;
};

function getErrorMessage(err: any): string {
  const status = err?.response?.status;
  const data = err?.response?.data;

  if (typeof data?.message === "string") return data.message;
  if (Array.isArray(data?.message)) return data.message.join(", ");

  if (status === 409) return "El username o email ya existe.";
  if (status === 400) return "Datos inválidos. Revisa los campos.";
  if (status === 401) return "Sesión inválida. Vuelve a iniciar sesión.";
  if (status === 403) return "No tienes permisos para esta acción.";
  return "Ocurrió un error inesperado.";
}

export default function Users() {
  // tabla
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);

  // filtros
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  // roles (multi-rol)
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // modal crear
  const [openCreate, setOpenCreate] = useState(false);
  const [cUsername, setCUsername] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cFullName, setCFullName] = useState("");
  const [cRoles, setCRoles] = useState<string[]>([]); // ✅ multi-rol
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string>("");

  // modal contraseña (crear/reset)
  const [pwModal, setPwModal] = useState<PasswordModalState>({
    open: false,
    title: "",
  });
  const [copied, setCopied] = useState(false);

  const isLocked = (u: User) => {
    if (!u.locked_until) return false;
    const dt = new Date(u.locked_until);
    return dt > new Date();
  };

  const lockLabel = (u: User) => {
    if (!u.locked_until) return "—";
    const dt = new Date(u.locked_until);
    if (dt <= new Date()) return "—";
    return dt.toLocaleString();
  };

  const fetchUsers = async (opts?: { keepPage?: boolean }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (opts?.keepPage ? page : 1).toString(),
        limit: limit.toString(),
      });

      if (search) params.append("q", search);
      if (activeFilter) params.append("is_active", activeFilter);

      const res = await api.get(`/users?${params.toString()}`);
      setUsers(res.data.data ?? []);
      setMeta(res.data.meta ?? null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      // ✅ Ruta asumida:
      // GET /roles => [{ id, name, description }]
      const res = await api.get<Role[]>("/roles");
      setRoles(res.data ?? []);
    } catch (err) {
      console.error("Error fetching roles:", err);
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers({ keepPage: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const handleSearch = async () => {
    setPage(1);
    await fetchUsers({ keepPage: false });
  };

  const nextPage = () => {
    if (meta && page < meta.totalPages) setPage(page + 1);
  };

  const prevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const resetCreateForm = () => {
    setCUsername("");
    setCEmail("");
    setCFullName("");
    setCRoles([]);
    setCreateError("");
  };

  const openPasswordModal = (title: string, username: string, tempPassword: string) => {
    setCopied(false);
    setPwModal({ open: true, title, username, tempPassword });
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(pwModal.tempPassword ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert("No se pudo copiar automáticamente. Copia manualmente.");
    }
  };

  const openCreateModal = async () => {
    setOpenCreate(true);
    resetCreateForm();

    // cargar roles solo si no están cargados
    if (roles.length === 0) {
      await fetchRoles();
    }
  };

  const toggleRole = (roleName: string) => {
    setCRoles((prev) =>
      prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]
    );
  };

  const submitCreate = async () => {
    setCreateError("");

    if (!cUsername.trim() || !cEmail.trim()) {
      setCreateError("Username y Email son obligatorios");
      return;
    }
    if (cUsername.trim().length < 3) {
      setCreateError("Username mínimo 3 caracteres");
      return;
    }
    if (!cEmail.includes("@")) {
      setCreateError("Email inválido");
      return;
    }
    if (cRoles.length < 1) {
      setCreateError("Debes seleccionar al menos 1 rol");
      return;
    }

    setCreating(true);
    try {
      const res = await api.post("/users", {
        username: cUsername.trim(),
        email: cEmail.trim(),
        full_name: cFullName.trim() || null,
        roles: cRoles, // ✅ multi-rol
      });

      const tempPassword = res.data?.tempPassword as string | undefined;
      const createdUser = res.data?.user;

      setOpenCreate(false);
      resetCreateForm();

      // refrescar tabla
      setPage(1);
      await fetchUsers({ keepPage: false });

      if (tempPassword && createdUser?.username) {
        openPasswordModal("Usuario creado", createdUser.username, tempPassword);
      } else {
        alert("✅ Usuario creado.");
      }
    } catch (err: any) {
      console.error("Create user error:", err?.response?.data || err);
      setCreateError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (u: User, next: boolean) => {
    try {
      await api.patch(`/users/${u.id}/active`, { is_active: next });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_active: next } : x)));
    } catch (err: any) {
      console.error("Toggle active error:", err?.response?.data || err);
      alert(getErrorMessage(err));
    }
  };

  const unlock = async (u: User) => {
    if (!confirm(`¿Desbloquear al usuario ${u.username}?`)) return;

    try {
      // ✅ tu backend: PATCH /users/:id/unlock
      await api.patch(`/users/${u.id}/unlock`);

      // refrescar fila
      setUsers((prev) =>
        prev.map((x) =>
          x.id === u.id ? { ...x, failed_attempts: 0, locked_until: null } : x
        )
      );

      alert("✅ Usuario desbloqueado.");
    } catch (err: any) {
      console.error("Unlock error:", err?.response?.data || err);
      alert(getErrorMessage(err));
    }
  };

  const resetPassword = async (u: User) => {
    if (!confirm(`¿Resetear contraseña de ${u.username}? Se generará una contraseña temporal.`)) return;

    try {
      const res = await api.post(`/users/${u.id}/reset-password`, {
        must_change_password: true,
      });

      const tempPassword = res.data?.tempPassword as string | undefined;

      // refrescar UI: al reset, debe forzar must_change_password y limpiar lock
      setUsers((prev) =>
        prev.map((x) =>
          x.id === u.id
            ? { ...x, must_change_password: true, failed_attempts: 0, locked_until: null }
            : x
        )
      );

      if (tempPassword) {
        openPasswordModal("Contraseña reseteada", u.username, tempPassword);
      } else {
        alert("✅ Contraseña reseteada.");
      }
    } catch (err: any) {
      console.error("Reset password error:", err?.response?.data || err);
      alert(getErrorMessage(err));
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Usuarios</h2>
        <button onClick={openCreateModal}>+ Crear usuario</button>
      </div>

      {/* filtros */}
      <div style={filterBar}>
        <input
          placeholder="Buscar (username/email/nombre)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={inputStyle}
        />

        <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} style={inputStyle}>
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>

        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          style={inputStyle}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>

        <button onClick={handleSearch}>Buscar</button>
      </div>

      {loading && <p>Cargando...</p>}

      {!loading && (
        <>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={th}>Usuario</th>
                <th style={th}>Email</th>
                <th style={th}>Nombre</th>
                <th style={th}>Activo</th>
                <th style={th}>Bloqueo</th>
                <th style={th}>Creado</th>
                <th style={th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const locked = isLocked(u);
                return (
                  <tr key={u.id}>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{u.username}</div>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>
                        {u.must_change_password ? "Debe cambiar contraseña" : "—"}
                      </div>
                    </td>
                    <td style={td}>{u.email}</td>
                    <td style={td}>{u.full_name ?? "-"}</td>

                    <td style={td}>
                      <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={u.is_active}
                          onChange={(e) => toggleActive(u, e.target.checked)}
                        />
                        {u.is_active ? "Activo" : "Inactivo"}
                      </label>
                    </td>

                    <td style={td}>
                      {locked ? (
                        <span style={pillRed}>Bloqueado hasta {lockLabel(u)}</span>
                      ) : (
                        <span style={pillGreen}>OK</span>
                      )}
                      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                        Intentos: {u.failed_attempts ?? 0}
                      </div>
                    </td>

                    <td style={td}>{new Date(u.created_at).toLocaleDateString()}</td>

                    <td style={td}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button onClick={() => resetPassword(u)}>Reset pass</button>
                        <button onClick={() => unlock(u)} disabled={!locked}>
                          Desbloquear
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && (
                <tr>
                  <td style={td} colSpan={7}>
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {meta && (
            <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={prevPage} disabled={page === 1}>
                Anterior
              </button>

              <span>
                Página {meta.page} de {meta.totalPages} — Total: {meta.total}
              </span>

              <button onClick={nextPage} disabled={page === meta.totalPages}>
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal crear */}
      {openCreate && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <h3 style={{ margin: 0 }}>Crear usuario</h3>
              <button
                onClick={() => {
                  setOpenCreate(false);
                  resetCreateForm();
                }}
              >
                X
              </button>
            </div>

            <div style={{ height: 12 }} />

            <label style={label}>Username *</label>
            <input style={inputStyle2} value={cUsername} onChange={(e) => setCUsername(e.target.value)} />

            <div style={{ height: 10 }} />

            <label style={label}>Email *</label>
            <input style={inputStyle2} value={cEmail} onChange={(e) => setCEmail(e.target.value)} />

            <div style={{ height: 10 }} />

            <label style={label}>Nombre completo</label>
            <input style={inputStyle2} value={cFullName} onChange={(e) => setCFullName(e.target.value)} />

            <div style={{ height: 10 }} />

            <label style={label}>Roles (elige uno o más) *</label>

            {rolesLoading ? (
              <div style={{ opacity: 0.8 }}>Cargando roles...</div>
            ) : roles.length === 0 ? (
              <div style={{ color: "#ff8a8a" }}>
                No se pudieron cargar roles. Verifica backend <b>GET /roles</b>.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                {roles.map((r) => (
                  <label key={r.id} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={cRoles.includes(r.name)}
                      onChange={() => toggleRole(r.name)}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.name}</div>
                      {r.description ? (
                        <div style={{ fontSize: 12, opacity: 0.75 }}>{r.description}</div>
                      ) : null}
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
              Seleccionados: {cRoles.length ? cRoles.join(", ") : "ninguno"}
            </div>

            {createError ? (
              <div style={{ marginTop: 10, color: "#ff8a8a" }}>{createError}</div>
            ) : null}

            <div style={{ height: 16 }} />

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setOpenCreate(false);
                  resetCreateForm();
                }}
                disabled={creating}
              >
                Cancelar
              </button>
              <button onClick={submitCreate} disabled={creating || rolesLoading}>
                {creating ? "Creando..." : "Crear"}
              </button>
            </div>

            <p style={{ marginTop: 12, opacity: 0.8 }}>
              * Se generará una contraseña temporal y el usuario deberá cambiarla al primer login.
            </p>
          </div>
        </div>
      )}

      {/* Modal Password */}
      {pwModal.open && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <h3 style={{ margin: 0 }}>{pwModal.title}</h3>
              <button onClick={() => setPwModal({ open: false, title: "" })}>X</button>
            </div>

            <div style={{ height: 10 }} />

            <p style={{ marginTop: 0, opacity: 0.85 }}>
              Usuario: <b>{pwModal.username ?? "-"}</b>
            </p>

            <label style={label}>Contraseña temporal (se muestra una sola vez)</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input style={inputStyle2} value={pwModal.tempPassword ?? ""} readOnly />
              <button onClick={copyPassword}>{copied ? "Copiado ✅" : "Copiar"}</button>
            </div>

            <p style={{ marginTop: 12, opacity: 0.75 }}>
              Recomendado: envíala por un canal seguro y obliga al usuario a cambiarla al ingresar.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setPwModal({ open: false, title: "" })}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// estilos
const filterBar: React.CSSProperties = {
  display: "flex",
  gap: 12,
  margin: "16px 0",
  flexWrap: "wrap",
};

const inputStyle: React.CSSProperties = {
  padding: 6,
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const th: React.CSSProperties = {
  borderBottom: "1px solid #555",
  padding: 8,
  textAlign: "left",
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #333",
  padding: 8,
  verticalAlign: "top",
};

const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  display: "grid",
  placeItems: "center",
  padding: 16,
  zIndex: 9999,
};

const modalCard: React.CSSProperties = {
  width: 520,
  maxWidth: "100%",
  background: "#151515",
  border: "1px solid #333",
  borderRadius: 12,
  padding: 16,
};

const label: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
};

const inputStyle2: React.CSSProperties = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #555",
  background: "#0f0f0f",
  color: "white",
};

const pillGreen: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #1f6f3a",
  background: "rgba(31,111,58,0.15)",
  fontSize: 12,
};

const pillRed: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #7a1d1d",
  background: "rgba(122,29,29,0.15)",
  fontSize: 12,
};