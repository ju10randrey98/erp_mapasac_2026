import { useNavigate } from "react-router-dom";

export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Acceso denegado</h2>
      <p style={{ opacity: 0.85 }}>
        No tienes permisos para ver este módulo. Si crees que es un error, solicita acceso al administrador.
      </p>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button onClick={() => navigate(-1)}>Volver</button>
        <button onClick={() => navigate("/")}>Ir al Dashboard</button>
      </div>
    </div>
  );
}