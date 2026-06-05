import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function SolicitudesPush() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarSolicitudes = async (usuarioActual) => {
    try {
      const response = await fetch(
        `/api/solicitudes_push.php?usuario_id=${usuarioActual.id}&rol=${usuarioActual.rol}`
      );

      const data = await response.json();
      setSolicitudes(data);
    } catch (error) {
      console.error("Error cargando solicitudes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");

    if (!usuarioGuardado) {
      navigate("/");
      return;
    }

    const usuarioParseado = JSON.parse(usuarioGuardado);

    if (usuarioParseado.rol === "consulta") {
      navigate("/dashboard");
      return;
    }

    setUsuario(usuarioParseado);
    cargarSolicitudes(usuarioParseado);
  }, [navigate]);

  const aprobarSolicitud = async (id) => {
    if (!window.confirm("¿Seguro que deseas aprobar esta solicitud?")) return;

    try {
      const response = await fetch(
        "/api/aprobar_solicitud_push.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            usuario_id: usuario.id,
            rol: usuario.rol,
          }),
        }
      );

      const data = await response.json();
      alert(data.mensaje);

      if (data.success) {
        cargarSolicitudes(usuario);
      }
    } catch (error) {
      console.error("Error aprobando:", error);
      alert("Error al aprobar");
    }
  };

  const rechazarSolicitud = async (id) => {
    const comentario = window.prompt("Motivo del rechazo:");

    if (comentario === null) return;

    try {
      const response = await fetch(
        "/api/rechazar_solicitud_push.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            usuario_id: usuario.id,
            rol: usuario.rol,
            comentario,
          }),
        }
      );

      const data = await response.json();
      alert(data.mensaje);

      if (data.success) {
        cargarSolicitudes(usuario);
      }
    } catch (error) {
      console.error("Error rechazando:", error);
      alert("Error al rechazar");
    }
  };

  if (loading) {
    return <div className="container mt-5">Cargando solicitudes...</div>;
  }

  return (
    <div className="container mt-5">
      <h3>Solicitudes</h3>

      <div className="mt-3 mb-3">
        {usuario && usuario.rol === "operador" && (
          <button
            className="btn btn-success me-2"
            onClick={() => navigate("/crear-migrante")}
          >
            Nueva solicitud
          </button>
        )}

        <button
          className="btn btn-secondary"
          onClick={() => navigate("/dashboard")}
        >
          Volver
        </button>
      </div>

      {solicitudes.length === 0 ? (
        <div className="alert alert-info">No hay solicitudes.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Solicitante</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Datos</th>
                <th>Comentario</th>
                <th>Creado</th>
                {(usuario.rol === "admin" || usuario.rol === "coordinador") && (
                  <th>Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.usuario_nombre}</td>
                  <td>{s.tipo_solicitud}</td>
                  <td>
                    <span
                      className={
                        s.estado === "pendiente"
                          ? "badge bg-warning text-dark"
                          : s.estado === "aprobada"
                            ? "badge bg-success"
                            : "badge bg-danger"
                      }
                    >
                      {s.estado}
                    </span>
                  </td>
                  <td>
                    <small>
                      <strong>Nombre:</strong> {s.datos_json?.nombre}{" "}
                      {s.datos_json?.apellido_paterno}
                      <br />
                      <strong>Nacionalidad:</strong>{" "}
                      {s.datos_json?.nacionalidad}
                      <br />
                      <strong>Teléfono:</strong> {s.datos_json?.telefono}
                    </small>
                  </td>
                  <td>{s.comentario}</td>
                  <td>{s.creado_en}</td>

                  {(usuario.rol === "admin" || usuario.rol === "coordinador") && (
                    <td>
                      {s.estado === "pendiente" ? (
                        <>
                          <button
                            className="btn btn-success btn-sm me-2"
                            onClick={() => aprobarSolicitud(s.id)}
                          >
                            Aprobar
                          </button>

                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => rechazarSolicitud(s.id)}
                          >
                            Rechazar
                          </button>
                        </>
                      ) : (
                        <span className="text-muted">Procesada</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SolicitudesPush;



