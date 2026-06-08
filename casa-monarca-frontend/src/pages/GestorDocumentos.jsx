import { useEffect, useState } from "react";
import "./GestorDocumentos.css";

const etapas = {
  V: "Ventanilla",
  O: "Operador / Verificación",
  C: "Coordinador / Firma",
  A: "Inserción final",
};

function GestorDocumentos() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  const [documentos, setDocumentos] = useState([]);
  const [coordinadores, setCoordinadores] = useState([]);

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [mensaje, setMensaje] = useState("");

  const [documentoFirma, setDocumentoFirma] = useState(null);
  const [passwordFirma, setPasswordFirma] = useState("");
  const [coordinadoresSeleccionados, setCoordinadoresSeleccionados] = useState([]);

  const cargarDocumentos = async () => {
    const res = await fetch(
      `/api/documentos.php?usuario_id=${usuario.id}&rol=${usuario.rol}`
    );

    const data = await res.json();

    if (data.success) {
      setDocumentos(data.documentos);
    }
  };

  const cargarCoordinadores = async () => {
    const res = await fetch("/api/coordinadores.php");
    const data = await res.json();

    if (data.success) {
      setCoordinadores(data.coordinadores);
    }
  };

  useEffect(() => {
    cargarDocumentos();
    cargarCoordinadores();
  }, []);

  const crearDocumento = async (e) => {
    e.preventDefault();
    setMensaje("");

    const formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("descripcion", descripcion);
    formData.append("creado_por", usuario.id);

    if (archivo) {
      formData.append("archivo", archivo);
    }

    const res = await fetch("/api/crear_documento.php", {
      method: "POST",
      body: formData,
    });

    const texto = await res.text();
    console.log("Respuesta crear_documento:", texto);

    let data;

    try {
      data = JSON.parse(texto);
    } catch (error) {
      setMensaje("Respuesta inválida del servidor al crear documento.");
      return;
    }

    if (!data.success) {
      setMensaje(data.mensaje || "Error creando documento");
      return;
    }

    setTitulo("");
    setDescripcion("");
    setArchivo(null);
    setMensaje("Documento creado correctamente");
    cargarDocumentos();
  };

  const avanzarDocumento = async (documento_id) => {
    const res = await fetch("/api/avanzar_documento.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documento_id,
        usuario_id: usuario.id,
        rol: usuario.rol,
        comentario: "Avance de etapa",
      }),
    });

    const texto = await res.text();
    console.log("Respuesta avanzar_documento:", texto);

    let data;

    try {
      data = JSON.parse(texto);
    } catch (error) {
      alert("Respuesta inválida del servidor al avanzar.");
      return;
    }

    if (!data.success) {
      alert(data.mensaje || "No se pudo avanzar el documento");
      return;
    }

    alert(data.mensaje || "Documento avanzado correctamente");
    cargarDocumentos();
  };

  const rechazarDocumento = async (doc) => {
    const motivo = window.prompt("Escribe el motivo del rechazo:");

    if (!motivo) {
      return;
    }

    const res = await fetch("/api/rechazar_documento.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documento_id: doc.id,
        usuario_id: usuario.id,
        motivo,
      }),
    });

    const texto = await res.text();
    console.log("Respuesta rechazar_documento:", texto);

    let data;

    try {
      data = JSON.parse(texto);
    } catch (error) {
      alert("Respuesta inválida del servidor al rechazar.");
      return;
    }

    if (!data.success) {
      alert(data.mensaje || "No se pudo rechazar el documento");
      return;
    }

    alert(data.mensaje || "Documento rechazado correctamente");
    cargarDocumentos();
  };

  const eliminarDocumento = async (doc) => {
    const confirmar = window.confirm(
      `¿Seguro que quieres eliminar el documento "${doc.titulo}"? Esta acción no se puede deshacer.`
    );

    if (!confirmar) {
      return;
    }

    const res = await fetch("/api/eliminar_documento.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documento_id: doc.id,
        usuario_id: usuario.id,
      }),
    });

    const texto = await res.text();
    console.log("Respuesta eliminar_documento:", texto);

    let data;

    try {
      data = JSON.parse(texto);
    } catch (error) {
      alert("Respuesta inválida del servidor al eliminar.");
      return;
    }

    if (!data.success) {
      alert(data.mensaje || "No se pudo eliminar el documento");
      return;
    }

    alert(data.mensaje || "Documento eliminado correctamente");
    cargarDocumentos();
  };

  const abrirPanelFirma = (doc) => {
    setDocumentoFirma(doc);
    setPasswordFirma("");
    setCoordinadoresSeleccionados([]);
  };

  const cerrarPanelFirma = () => {
    setDocumentoFirma(null);
    setPasswordFirma("");
    setCoordinadoresSeleccionados([]);
  };

  const toggleCoordinador = (coordinadorId) => {
    setCoordinadoresSeleccionados((prev) => {
      if (prev.includes(coordinadorId)) {
        return prev.filter((id) => id !== coordinadorId);
      }

      return [...prev, coordinadorId];
    });
  };

  const firmarDocumento = async () => {
    if (!documentoFirma) {
      return;
    }

    if (!passwordFirma) {
      alert("Ingresa tu contraseña de firma.");
      return;
    }

    const res = await fetch("/api/firmar_documento.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documento_id: documentoFirma.id,
        usuario_id: usuario.id,
        password_firma: passwordFirma,
        coordinadores_adicionales: coordinadoresSeleccionados,
      }),
    });

    const texto = await res.text();
    console.log("Respuesta firmar_documento:", texto);

    let data;

    try {
      data = JSON.parse(texto);
    } catch (error) {
      alert("Respuesta inválida del servidor al firmar.");
      return;
    }

    if (!data.success) {
      alert(data.mensaje || "No se pudo firmar el documento");
      return;
    }

    if (data.folio_firma) {
      alert(`${data.mensaje}\nFolio: ${data.folio_firma}`);
    } else {
      alert(data.mensaje || "Documento firmado correctamente");
    }

    cerrarPanelFirma();
    cargarDocumentos();
  };

  const verificarFirma = async (documento_id) => {
    const res = await fetch(
      `/api/verificar_firma_documento.php?documento_id=${documento_id}`
    );

    const texto = await res.text();
    console.log("Respuesta verificar_firma:", texto);

    let data;

    try {
      data = JSON.parse(texto);
    } catch (error) {
      alert("Respuesta inválida del servidor al verificar firma.");
      return;
    }

    if (!data.success) {
      alert(data.mensaje || "No se pudo verificar la firma");
      return;
    }

    if (data.firmas && data.firmas.length > 0) {
      const resumen = data.firmas
        .map((firma) => {
          return `${firma.coordinador || "Coordinador"}: ${firma.estado} / ${firma.verificacion}`;
        })
        .join("\n");

      alert(`${data.mensaje}\n\n${resumen}`);
    } else {
      alert(data.mensaje || "Verificación realizada");
    }
  };

  const estaRechazado = (doc) => {
    return doc.estado_documento === "rechazado";
  };

  const puedeAvanzar = (doc) => {
    if (estaRechazado(doc)) {
      return false;
    }

    if (usuario.rol === "admin" && (doc.etapa === "V" || doc.etapa === "C")) {
      return true;
    }

    if (usuario.rol === "operador" && doc.etapa === "V") {
      return true;
    }

    return false;
  };

  const tieneFirmaPendiente = (doc) => {
    if (!doc.firmas || doc.firmas.length === 0) {
      return false;
    }

    return doc.firmas.some(
      (firma) =>
        Number(firma.coordinador_id) === Number(usuario.id) &&
        firma.estado === "pendiente"
    );
  };

  const puedeFirmar = (doc) => {
    if (estaRechazado(doc)) {
      return false;
    }

    if (usuario.rol !== "coordinador") {
      return false;
    }

    if (doc.etapa === "O" && Number(doc.coordinador_id) === Number(usuario.id)) {
      return true;
    }

    if (doc.etapa === "C" && tieneFirmaPendiente(doc)) {
      return true;
    }

    return false;
  };

  const puedeRechazar = (doc) => {
    if (estaRechazado(doc) || doc.etapa === "A") {
      return false;
    }

    if (usuario.rol === "admin") {
      return true;
    }

    if (usuario.rol === "operador" && doc.etapa === "V") {
      return true;
    }

    if (usuario.rol === "coordinador" && (doc.etapa === "O" || doc.etapa === "C")) {
      return true;
    }

    return false;
  };

  const puedeEliminar = () => {
    return usuario.rol === "admin";
  };

  const textoBotonAvance = (doc) => {
    if (doc.etapa === "V") return "Aprobar";
    if (doc.etapa === "C") return "Inserción final";
    return "Avanzar";
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "Sin fecha";
    return fecha;
  };

  const contarEtapa = (etapa) => {
    return documentos.filter((doc) => doc.etapa === etapa).length;
  };

  const contarRechazados = () => {
    return documentos.filter((doc) => estaRechazado(doc)).length;
  };

  const claseEtapa = (etapa) => {
    return `stage-badge stage-${(etapa || "").toLowerCase()}`;
  };

  const coordinadoresDisponiblesParaFirma = () => {
    if (!documentoFirma) {
      return [];
    }

    const yaFirmantes = (documentoFirma.firmas || []).map((firma) =>
      Number(firma.coordinador_id)
    );

    return coordinadores.filter((coord) => {
      const coordId = Number(coord.id);

      if (coordId === Number(usuario.id)) {
        return false;
      }

      if (yaFirmantes.includes(coordId)) {
        return false;
      }

      return true;
    });
  };

  return (
    <div className="container-fluid gestor-docs px-4 py-4">
      <div className="gestor-header">
        <div>
          <h1 className="gestor-title">Gestor de documentos</h1>
          <p className="gestor-subtitle">
            Flujo del proceso: <strong>V</strong> → <strong>O</strong> →{" "}
            <strong>C</strong> → <strong>A</strong>
          </p>
        </div>

        <div className="user-pill">
          <span>{usuario.nombre}</span>
          <small>{usuario.rol}</small>
        </div>
      </div>

      <div className="stats-grid mb-4">
        <div className="stat-card">
          <span className="stat-number">{documentos.length}</span>
          <span className="stat-label">Total documentos</span>
        </div>

        <div className="stat-card">
          <span className="stat-number">{contarEtapa("V")}</span>
          <span className="stat-label">Ventanilla</span>
        </div>

        <div className="stat-card">
          <span className="stat-number">{contarEtapa("O")}</span>
          <span className="stat-label">Verificación</span>
        </div>

        <div className="stat-card">
          <span className="stat-number">{contarEtapa("C")}</span>
          <span className="stat-label">Firma</span>
        </div>

        <div className="stat-card">
          <span className="stat-number">{contarEtapa("A")}</span>
          <span className="stat-label">Finalizados</span>
        </div>

        <div className="stat-card">
          <span className="stat-number text-danger">{contarRechazados()}</span>
          <span className="stat-label">Rechazados</span>
        </div>
      </div>

      {mensaje && <div className="alert alert-info">{mensaje}</div>}

      <form onSubmit={crearDocumento} className="card form-card p-4 mb-4">
        <div className="form-card-header">
          <div>
            <h4>Nuevo documento</h4>
            <p>Sube un archivo para iniciar el flujo en etapa Ventanilla.</p>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Título</label>
          <input
            className="form-control form-control-lg"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej. Expediente de validación"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Descripción</label>
          <textarea
            className="form-control"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Agrega una descripción breve del documento"
            rows="3"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Archivo</label>
          <input
            type="file"
            className="form-control"
            onChange={(e) => setArchivo(e.target.files[0])}
          />
        </div>

        <button className="btn btn-primary btn-lg w-100">
          Subir documento
        </button>
      </form>

      {documentoFirma && (
        <div className="card form-card p-4 mb-4 border-primary">
          <h4>Firmar documento</h4>

          <p className="mb-2">
            Documento: <strong>{documentoFirma.titulo}</strong>
          </p>

          <div className="mb-3">
            <label className="form-label">Contraseña de firma</label>
            <input
              type="password"
              className="form-control"
              value={passwordFirma}
              onChange={(e) => setPasswordFirma(e.target.value)}
              placeholder="Ingresa tu contraseña de firma"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              Coordinadores adicionales que también deben firmar
            </label>

            {coordinadoresDisponiblesParaFirma().length === 0 ? (
              <p className="text-muted mb-0">
                No hay coordinadores adicionales disponibles.
              </p>
            ) : (
              <div className="row">
                {coordinadoresDisponiblesParaFirma().map((coord) => (
                  <div className="col-md-6 mb-2" key={coord.id}>
                    <label className="form-check border rounded p-2">
                      <input
                        type="checkbox"
                        className="form-check-input me-2"
                        checked={coordinadoresSeleccionados.includes(
                          Number(coord.id)
                        )}
                        onChange={() => toggleCoordinador(Number(coord.id))}
                      />
                      <span className="form-check-label">
                        {coord.nombre} - {coord.email}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={firmarDocumento}
            >
              Confirmar firma
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={cerrarPanelFirma}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="table-card">
        <div className="table-card-header">
          <div>
            <h4>Documentos registrados</h4>
            <p>Consulta el estado, firma y avance de cada documento.</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table docs-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Etapa</th>
                <th>Coordinador</th>
                <th>Archivo</th>
                <th>Firmas</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              {documentos.map((doc) => (
                <tr key={doc.id} className={estaRechazado(doc) ? "table-danger" : ""}>
                  <td>
                    <div className="doc-title">{doc.titulo}</div>
                    {doc.descripcion && (
                      <div className="doc-desc">{doc.descripcion}</div>
                    )}
                  </td>

                  <td>
                    <span className={claseEtapa(doc.etapa)}>
                      {doc.etapa} - {etapas[doc.etapa]}
                    </span>

                    {Number(doc.firmas_pendientes) > 0 && !estaRechazado(doc) && (
                      <div className="mt-2">
                        <span className="badge bg-warning text-dark">
                          {doc.firmas_pendientes} firma(s) pendiente(s)
                        </span>
                      </div>
                    )}

                    {estaRechazado(doc) && (
                      <div className="mt-2">
                        <span className="badge bg-danger">Rechazado</span>
                        <div className="small text-danger mt-1">
                          {doc.motivo_rechazo || "Sin motivo registrado"}
                        </div>
                      </div>
                    )}
                  </td>

                  <td>
                    {doc.coordinador_nombre ? (
                      <span className="coordinador-name">
                        {doc.coordinador_nombre}
                      </span>
                    ) : (
                      <span className="no-data">Sin asignar</span>
                    )}
                  </td>

                  <td>
                    {doc.archivo_ruta ? (
                      <a
                        className="file-link"
                        href={`http://localhost/casa-monarca-frontend/${doc.archivo_ruta}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver archivo
                      </a>
                    ) : (
                      <span className="no-data">Sin archivo</span>
                    )}
                  </td>

                  <td>
                    {doc.firmas && doc.firmas.length > 0 ? (
                      <div className="ticket-box">
                        {doc.firmas.map((firma, index) => (
                          <div className="mb-3" key={`${doc.id}-${index}`}>
                            <div>
                              <strong>{firma.coordinador_nombre}</strong>
                            </div>

                            <div>
                              Estado:{" "}
                              {firma.estado === "firmado" ? (
                                <span className="badge bg-success">
                                  Firmado
                                </span>
                              ) : (
                                <span className="badge bg-warning text-dark">
                                  Pendiente
                                </span>
                              )}
                            </div>

                            {firma.folio_firma && (
                              <div className="ticket-folio mt-1">
                                {firma.folio_firma}
                              </div>
                            )}

                            {firma.accion_firma && (
                              <div>
                                <strong>Acción:</strong> {firma.accion_firma}
                              </div>
                            )}

                            {firma.fecha_firma && (
                              <div>
                                <strong>Fecha:</strong>{" "}
                                {formatearFecha(firma.fecha_firma)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="no-data">Sin firmas</span>
                    )}
                  </td>

                  <td className="action-cell">
                    <div className="d-flex gap-2 flex-wrap">
                      {puedeAvanzar(doc) && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => avanzarDocumento(doc.id)}
                        >
                          {textoBotonAvance(doc)}
                        </button>
                      )}

                      {puedeFirmar(doc) && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => abrirPanelFirma(doc)}
                        >
                          Firmar documento
                        </button>
                      )}

                      {puedeRechazar(doc) && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => rechazarDocumento(doc)}
                        >
                          Rechazar
                        </button>
                      )}

                      {doc.firmas && doc.firmas.length > 0 && (
                        <button
                          className="btn btn-outline-dark btn-sm"
                          onClick={() => verificarFirma(doc.id)}
                        >
                          Verificar firmas
                        </button>
                      )}

                      {doc.etapa === "A" && (
                        <span className="badge bg-success final-badge">
                          Finalizado
                        </span>
                      )}

                      {puedeEliminar() && (
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => eliminarDocumento(doc)}
                        >
                          Eliminar
                        </button>
                      )}

                      {!puedeAvanzar(doc) &&
                        !puedeFirmar(doc) &&
                        !puedeRechazar(doc) &&
                        (!doc.firmas || doc.firmas.length === 0) &&
                        doc.etapa !== "A" &&
                        !puedeEliminar() && (
                          <span className="no-data">Sin acción</span>
                        )}
                    </div>
                  </td>
                </tr>
              ))}

              {documentos.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    No hay documentos disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default GestorDocumentos;