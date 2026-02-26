import { useEffect, useState } from "react";
import api from "../api/axios";

type AuditRow = {
  id: string;
  action: string;
  actor_id: string | null;
  target_id: string | null;
  ip: string | null;
  user_agent: string | null;
  details: any;
  created_at: string;
  actor?: { id: string; username: string; email: string };
  target?: { id: string; username: string; email: string };
};

type Meta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function Audit() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);

  // filtros
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [order, setOrder] = useState<"newest" | "oldest">("newest");

  const fetchAudit = async (opts?: { resetPage?: boolean }) => {
    setLoading(true);
    try {
      const nextPage = opts?.resetPage ? 1 : page;
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(limit),
        order,
      });

      if (q.trim()) params.append("q", q.trim());
      if (action.trim()) params.append("action", action.trim());
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);

      const res = await api.get(`/audit-logs?${params.toString()}`);
      setRows(res.data?.data ?? []);
      setMeta(res.data?.meta ?? null);
      if (opts?.resetPage) setPage(1);
    } catch (err) {
      console.error(err);
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, order]);

  const onSearch = async () => {
    await fetchAudit({ resetPage: true });
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Auditoría</h2>
      </div>

      <div style={filterBar}>
        <input
          style={inputStyle}
          placeholder="Buscar (acción / usuario / ip / user-agent)..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <input
          style={inputStyle}
          placeholder="Acción (ej: users.create)"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        />

        <input style={inputStyle} type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input style={inputStyle} type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />

        <select style={inputStyle} value={order} onChange={(e) => setOrder(e.target.value as any)}>
          <option value="newest">Más reciente</option>
          <option value="oldest">Más antiguo</option>
        </select>

        <select
          style={inputStyle}
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>

        <button onClick={onSearch}>Buscar</button>
      </div>

      {loading && <p>Cargando...</p>}

      {!loading && (
        <>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={th}>Fecha</th>
                <th style={th}>Acción</th>
                <th style={th}>Actor</th>
                <th style={th}>Target</th>
                <th style={th}>IP</th>
                <th style={th}>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={td}>{new Date(r.created_at).toLocaleString()}</td>
                  <td style={td}>
                    <div style={{ fontWeight: 600 }}>{r.action}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{r.user_agent ?? "—"}</div>
                  </td>
                  <td style={td}>{r.actor?.username ?? "—"}</td>
                  <td style={td}>{r.target?.username ?? "—"}</td>
                  <td style={td}>{r.ip ?? "—"}</td>
                  <td style={td}>
                    <pre style={preStyle}>{JSON.stringify(r.details ?? {}, null, 2)}</pre>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td style={td} colSpan={6}>
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {meta && (
            <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Anterior
              </button>

              <span>
                Página {meta.page} de {meta.totalPages} — Total: {meta.total}
              </span>

              <button onClick={() => setPage((p) => (meta ? Math.min(meta.totalPages, p + 1) : p + 1))} disabled={!!meta && page >= meta.totalPages}>
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const filterBar: React.CSSProperties = {
  display: "flex",
  gap: 12,
  margin: "16px 0",
  flexWrap: "wrap",
};

const inputStyle: React.CSSProperties = {
  padding: 8,
  borderRadius: 8,
  border: "1px solid #333",
  background: "#0f0f0f",
  color: "white",
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

const preStyle: React.CSSProperties = {
  margin: 0,
  maxWidth: 520,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  fontSize: 12,
  opacity: 0.9,
};