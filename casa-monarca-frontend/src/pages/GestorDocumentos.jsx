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
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [mensaje, setMensaje] = useState("");

  const cargarDocumentos = async () => {
    const res = await fetch(
      `/api/documentos.php?usuario_id=${usuario.id}&rol=${usuario.rol}`
    );

    const data = await res.json();

    if (data.success) {
      setDocumentos(data.documentos);
    }
  };

  useEffect(() => {
    cargarDocumentos();
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

  const firmarDocumento = async (documento_id) => {
    const passwordFirma = window.prompt("Ingresa tu contraseña de firma:");

    if (!passwordFirma) {
      return;
    }

    const res = await fetch("/api/firmar_documento.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documento_id,
        usuario_id: usuario.id,
        password_firma: passwordFirma,
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

    if (data.coordinador) {
      alert(`${data.mensaje}\nCoordinador: ${data.coordinador}`);
    } else {
      alert(data.mensaje || "Verificación realizada");
    }
  };

  const puedeAvanzar = (doc) => {
    if (usuario.rol === "admin" && (doc.etapa === "V" || doc.etapa === "C")) {
      return true;
    }

    if (usuario.rol === "operador" && doc.etapa === "V") {
      return true;
    }

    return false;
  };

  const puedeFirmar = (doc) => {
    return usuario.rol === "coordinador" && doc.etapa === "O";
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

  const claseEtapa = (etapa) => {
    return `stage-badge stage-${(etapa || "").toLowerCase()}`;
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
                <th>Ticket de firma</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              {documentos.map((doc) => (
                <tr key={doc.id}>
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
                    {doc.folio_firma ? (
                      <div className="ticket-box">
                        <div className="ticket-folio">{doc.folio_firma}</div>

                        <div>
                          <strong>Firmado por:</strong>{" "}
                          {doc.firmado_por_nombre || "Coordinador"}
                        </div>

                        <div>
                          <strong>Acción:</strong>{" "}
                          {doc.accion_firma || "Documento firmado digitalmente"}
                        </div>

                        <div>
                          <strong>Fecha:</strong>{" "}
                          {formatearFecha(doc.fecha_firma)}
                        </div>
                      </div>
                    ) : doc.firma_coordinador ? (
                      <div className="ticket-box">
                        <span className="badge bg-warning text-dark mb-2">
                          Firmado sin folio
                        </span>

                        <div>
                          <strong>Fecha:</strong>{" "}
                          {formatearFecha(doc.fecha_firma)}
                        </div>
                      </div>
                    ) : (
                      <span className="no-data">Sin firma</span>
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
                          onClick={() => firmarDocumento(doc.id)}
                        >
                          Firmar documento
                        </button>
                      )}

                      {doc.firma_coordinador && (
                        <button
                          className="btn btn-outline-dark btn-sm"
                          onClick={() => verificarFirma(doc.id)}
                        >
                          Verificar firma
                        </button>
                      )}

                      {doc.etapa === "A" && (
                        <span className="badge bg-success final-badge">
                          Finalizado
                        </span>
                      )}

                      {!puedeAvanzar(doc) &&
                        !puedeFirmar(doc) &&
                        !doc.firma_coordinador &&
                        doc.etapa !== "A" && (
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