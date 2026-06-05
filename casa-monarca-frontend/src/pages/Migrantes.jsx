import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function Migrantes() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(null);
  const [migrantes, setMigrantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [registroAbierto, setRegistroAbierto] = useState(null);
  const [error, setError] = useState("");

  const cargarMigrantes = async (usuarioActual) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/migrantes.php?usuario_id=${usuarioActual.id}&rol=${usuarioActual.rol}`
      );

      const texto = await response.text();
      console.log("RAW migrantes.php:", texto);

      let data;

      try {
        data = JSON.parse(texto);
      } catch (error) {
        console.error("Respuesta no JSON de migrantes.php:", texto);
        setError("La respuesta del servidor no es JSON válido.");
        setMigrantes([]);
        return;
      }

      if (!Array.isArray(data)) {
        setError(data.mensaje || "Error al cargar registros.");
        setMigrantes([]);
        return;
      }

      setMigrantes(data);
    } catch (error) {
      console.error("Error cargando migrantes:", error);
      setError("Error de conexión al cargar registros.");
      setMigrantes([]);
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

    setUsuario(usuarioParseado);
    cargarMigrantes(usuarioParseado);
  }, [navigate]);

  const migrantesFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (texto === "") {
      return migrantes;
    }

    return migrantes.filter((m) => {
      const contenido = `
        ${m.id || ""}
        ${m.nombre || ""}
        ${m.apellido_paterno || ""}
        ${m.apellido_materno || ""}
        ${m.fecha_nacimiento || ""}
        ${m.edad || ""}
        ${m.sexo || ""}
        ${m.nacionalidad || ""}
        ${m.telefono || ""}
        ${m.email || ""}
        ${m.pais_origen || ""}
        ${m.estado_origen || ""}
        ${m.ciudad_origen || ""}
        ${m.pais_destino || ""}
        ${m.estado_destino || ""}
        ${m.ciudad_destino || ""}
        ${m.estatus_migratorio || ""}
        ${m.motivo_atencion || ""}
        ${m.observaciones || ""}
        ${m.creado_por_nombre || ""}
        ${m.creado_en || ""}
        ${m.actualizado_en || ""}
      `.toLowerCase();

      return contenido.includes(texto);
    });
  }, [busqueda, migrantes]);

  const toggleDetalle = (id) => {
    setRegistroAbierto(registroAbierto === id ? null : id);
  };

  const formatearNombre = (m) => {
    return [m.nombre, m.apellido_paterno, m.apellido_materno]
      .filter(Boolean)
      .join(" ");
  };

  const formatearOrigen = (m) => {
    return [m.ciudad_origen, m.estado_origen, m.pais_origen]
      .filter(Boolean)
      .join(", ");
  };

  const formatearDestino = (m) => {
    return [m.ciudad_destino, m.estado_destino, m.pais_destino]
      .filter(Boolean)
      .join(", ");
  };

  if (loading) {
    return <div className="container mt-5">Cargando registros...</div>;
  }

  return (
    <div className="container-fluid mt-5 px-4">
      <div className="card shadow p-4">
        <h1 className="mb-4">Registros de migrantes</h1>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="d-flex gap-2 flex-wrap mb-4">
          {usuario &&
            ["admin", "coordinador", "operador"].includes(usuario.rol) && (
              <button
                className="btn btn-success"
                onClick={() => navigate("/crear-migrante")}
              >
                Crear registro
              </button>
            )}

          <button
            className="btn btn-secondary"
            onClick={() => navigate("/dashboard")}
          >
            Volver
          </button>
        </div>

        <div className="mb-4">
          <label className="form-label fw-bold">Buscar registro</label>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre, nacionalidad, teléfono, ciudad, estatus, motivo, observaciones..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <p className="text-muted">
          Mostrando {migrantesFiltrados.length} de {migrantes.length} registros.
        </p>

        {migrantesFiltrados.length === 0 ? (
          <div className="alert alert-info">No hay registros disponibles.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-striped align-middle">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Nombre completo</th>
                  <th>Nacionalidad</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Estatus</th>
                  <th>Creado por</th>
                  <th>Fecha</th>
                  <th>Detalle</th>
                </tr>
              </thead>

              <tbody>
                {migrantesFiltrados.map((m) => (
                  <Fragment key={m.id}>
                    <tr>
                      <td>{m.id}</td>
                      <td>{formatearNombre(m) || "-"}</td>
                      <td>{m.nacionalidad || "-"}</td>
                      <td>{m.telefono || "-"}</td>
                      <td>{m.email || "-"}</td>
                      <td>{formatearOrigen(m) || "-"}</td>
                      <td>{formatearDestino(m) || "-"}</td>
                      <td>{m.estatus_migratorio || "-"}</td>
                      <td>{m.creado_por_nombre || "-"}</td>
                      <td>{m.creado_en || "-"}</td>
                      <td>
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => toggleDetalle(m.id)}
                        >
                          {registroAbierto === m.id ? "Ocultar" : "Ver"}
                        </button>
                      </td>
                    </tr>

                    {registroAbierto === m.id && (
                      <tr>
                        <td colSpan="11">
                          <div className="card card-body bg-light">
                            <h5 className="mb-3">Detalle completo</h5>

                            <div className="row">
                              <div className="col-md-4 mb-3">
                                <strong>Nombre:</strong>
                                <p>{m.nombre || "-"}</p>
                              </div>

                              <div className="col-md-4 mb-3">
                                <strong>Apellido paterno:</strong>
                                <p>{m.apellido_paterno || "-"}</p>
                              </div>

                              <div className="col-md-4 mb-3">
                                <strong>Apellido materno:</strong>
                                <p>{m.apellido_materno || "-"}</p>
                              </div>

                              <div className="col-md-4 mb-3">
                                <strong>Fecha de nacimiento:</strong>
                                <p>{m.fecha_nacimiento || "-"}</p>
                              </div>

                              <div className="col-md-4 mb-3">
                                <strong>Edad:</strong>
                                <p>{m.edad || "-"}</p>
                              </div>

                              <div className="col-md-4 mb-3">
                                <strong>Sexo:</strong>
                                <p>{m.sexo || "-"}</p>
                              </div>

                              <div className="col-md-4 mb-3">
                                <strong>Nacionalidad:</strong>
                                <p>{m.nacionalidad || "-"}</p>
                              </div>

                              <div className="col-md-4 mb-3">
                                <strong>Teléfono:</strong>
                                <p>{m.telefono || "-"}</p>
                              </div>

                              <div className="col-md-4 mb-3">
                                <strong>Email:</strong>
                                <p>{m.email || "-"}</p>
                              </div>

                              <div className="col-md-4 mb-3">
                                <strong>País de origen:</strong>
                                <p>{m.pais_origen || "-"}</p>
                              </div>

                              <div className="col-md-4 mb-3">
                                <strong>Estado de origen:</strong>
                                <p>{m.estado_origen || "-"}</p>
                              </div>

                              <div className="col-md-4 mb-3">
                                <strong>Ciudad de origen:</strong>
                                <p>{m.ciudad_origen || "-"}</p>
                              </div>

                              <div className="col-md-4 mb-3">
                                <strong>País destino:</strong>
                                <p>{m.pais_destino || "-"}</p>
                              </div>

                              <div className="col-md-4 mb-3">
                                <strong>Estado destino:</strong>
                                <p>{m.estado_destino || "-"}</p>
                              </div>

                              <div className="col-md-4 mb-3">
                                <strong>Ciudad destino:</strong>
                                <p>{m.ciudad_destino || "-"}</p>
                              </div>

                              <div className="col-md-4 mb-3">
                                <strong>Estatus migratorio:</strong>
                                <p>{m.estatus_migratorio || "-"}</p>
                              </div>

                              <div className="col-md-4 mb-3">
                                <strong>Creado por:</strong>
                                <p>{m.creado_por_nombre || "-"}</p>
                              </div>

                              <div className="col-md-4 mb-3">
                                <strong>ID solicitud:</strong>
                                <p>{m.solicitud_id || "-"}</p>
                              </div>

                              <div className="col-md-6 mb-3">
                                <strong>Motivo de atención:</strong>
                                <p>{m.motivo_atencion || "-"}</p>
                              </div>

                              <div className="col-md-6 mb-3">
                                <strong>Observaciones:</strong>
                                <p>{m.observaciones || "-"}</p>
                              </div>

                              <div className="col-md-4 mb-3">
                                <strong>Creado en:</strong>
                                <p>{m.creado_en || "-"}</p>
                              </div>

                              <div className="col-md-4 mb-3">
                                <strong>Actualizado en:</strong>
                                <p>{m.actualizado_en || "-"}</p>
                              </div>

                              <div className="col-md-4 mb-3">
                                <strong>ID interno:</strong>
                                <p>{m.id || "-"}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Migrantes;



