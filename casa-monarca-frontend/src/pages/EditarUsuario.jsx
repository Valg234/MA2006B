import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function EditarUsuario() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [usuarioActual, setUsuarioActual] = useState(null);
  const [coordinadores, setCoordinadores] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    rol: "consulta",
    estado: "activo",
    fecha_vigencia: "",
    coordinador_id: "",
  });

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");

    if (!usuarioGuardado) {
      navigate("/");
      return;
    }

    const usuarioParseado = JSON.parse(usuarioGuardado);

    if (!["admin", "coordinador"].includes(usuarioParseado.rol)) {
      navigate("/dashboard");
      return;
    }

    setUsuarioActual(usuarioParseado);
    cargarDatos(usuarioParseado);
  }, [id, navigate]);

  const cargarDatos = async (usuarioSesion) => {
    try {
      setLoading(true);
      setError("");

      const usuarioResponse = await fetch(
        `/api/editar_usuario.php?id=${id}`
      );

      const usuarioTexto = await usuarioResponse.text();
      console.log("RAW editar_usuario.php:", usuarioTexto);

      const usuarioData = JSON.parse(usuarioTexto);

      if (!usuarioData.success) {
        setError(usuarioData.mensaje || "Error al cargar usuario.");
        return;
      }

      const u = usuarioData.usuario;

      if (
        usuarioSesion.rol === "coordinador" &&
        Number(u.coordinador_id) !== Number(usuarioSesion.id) &&
        Number(u.id) !== Number(usuarioSesion.id)
      ) {
        setError("No tienes permiso para editar este usuario.");
        return;
      }

      setForm({
        nombre: u.nombre || "",
        email: u.email || "",
        rol: u.rol || "consulta",
        estado: u.estado || "activo",
        fecha_vigencia: u.fecha_vigencia || "",
        coordinador_id: u.coordinador_id || "",
      });

      const usuariosResponse = await fetch(
        "/api/usuarios.php"
      );

      const usuariosTexto = await usuariosResponse.text();
      console.log("RAW usuarios.php:", usuariosTexto);

      const usuariosData = JSON.parse(usuariosTexto);

      if (Array.isArray(usuariosData)) {
        const coords = usuariosData.filter(
          (x) =>
            String(x.rol || "").toLowerCase().trim() === "coordinador" &&
            String(x.estado || "").toLowerCase().trim() === "activo"
        );

        setCoordinadores(coords);
      }
    } catch (error) {
      console.error("Error cargando usuario:", error);
      setError("Error al cargar usuario.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const nuevo = {
        ...prev,
        [name]: value,
      };

      if (name === "rol" && (value === "admin" || value === "coordinador")) {
        nuevo.coordinador_id = "";
      }

      return nuevo;
    });

    setMensaje("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMensaje("");
    setError("");

    if (
      form.nombre.trim() === "" ||
      form.email.trim() === "" ||
      form.fecha_vigencia === ""
    ) {
      setError("Completa nombre, correo y fecha de vigencia.");
      return;
    }

    if (
      (form.rol === "consulta" || form.rol === "operador") &&
      form.coordinador_id === ""
    ) {
      setError("Consulta y operador deben tener coordinador asignado.");
      return;
    }

    const payload = {
      id: Number(id),
      nombre: form.nombre,
      email: form.email,
      rol: usuarioActual.rol === "coordinador" ? form.rol : form.rol,
      estado: form.estado,
      fecha_vigencia: form.fecha_vigencia,
      coordinador_id:
        form.rol === "consulta" || form.rol === "operador"
          ? Number(form.coordinador_id)
          : null,
    };

    try {
      const response = await fetch(
        "/api/editar_usuario.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const texto = await response.text();
      console.log("RAW actualizar usuario:", texto);

      const data = JSON.parse(texto);

      if (data.success) {
        setMensaje(data.mensaje);
        setTimeout(() => navigate("/admin"), 700);
      } else {
        setError(data.mensaje || "No se pudo actualizar usuario.");
      }
    } catch (error) {
      console.error("Error actualizando usuario:", error);
      setError("Error de conexión al actualizar usuario.");
    }
  };

  if (loading) {
    return <div className="container mt-5">Cargando usuario...</div>;
  }

  return (
    <div className="container mt-5">
      <div className="card shadow p-4">
        <h1 className="mb-4">Editar usuario</h1>

        {mensaje && <div className="alert alert-success">{mensaje}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Nombre</label>
            <input
              name="nombre"
              className="form-control"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Correo electrónico</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          {usuarioActual?.rol === "admin" && (
            <div className="mb-3">
              <label className="form-label">Rol</label>
              <select
                name="rol"
                className="form-select"
                value={form.rol}
                onChange={handleChange}
              >
                <option value="admin">admin</option>
                <option value="coordinador">coordinador</option>
                <option value="consulta">consulta</option>
                <option value="operador">operador</option>
              </select>
            </div>
          )}

          {usuarioActual?.rol === "coordinador" && (
            <div className="mb-3">
              <label className="form-label">Rol</label>
              <input className="form-control" value={form.rol} disabled />
            </div>
          )}

          {(form.rol === "consulta" || form.rol === "operador") &&
            usuarioActual?.rol === "admin" && (
              <div className="mb-3">
                <label className="form-label">Coordinador asignado</label>
                <select
                  name="coordinador_id"
                  className="form-select"
                  value={form.coordinador_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona un coordinador</option>
                  {coordinadores.map((coord) => (
                    <option key={coord.id} value={coord.id}>
                      {coord.nombre} - {coord.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

          {usuarioActual?.rol === "coordinador" && (
            <div className="mb-3">
              <label className="form-label">Coordinador asignado</label>
              <input
                className="form-control"
                value={form.coordinador_id || "Sin coordinador"}
                disabled
              />
            </div>
          )}

          <div className="mb-3">
            <label className="form-label">Estado</label>
            <select
              name="estado"
              className="form-select"
              value={form.estado}
              onChange={handleChange}
            >
              <option value="activo">activo</option>
              <option value="inactivo">inactivo</option>
              <option value="revocado">revocado</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Fecha de vigencia</label>
            <input
              type="date"
              name="fecha_vigencia"
              className="form-control"
              value={form.fecha_vigencia}
              onChange={handleChange}
              required
            />
          </div>

          <button className="btn btn-primary me-2">Guardar cambios</button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/admin")}
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditarUsuario;



