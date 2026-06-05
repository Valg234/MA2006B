import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function CrearUsuario() {
  const navigate = useNavigate();

  const [usuarioActual, setUsuarioActual] = useState(null);
  const [coordinadores, setCoordinadores] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
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

    if (usuarioParseado.rol !== "admin") {
      navigate("/dashboard");
      return;
    }

    setUsuarioActual(usuarioParseado);
    cargarCoordinadores(usuarioParseado);
  }, [navigate]);

  const cargarCoordinadores = async () => {
    try {
      const response = await fetch(
        "/api/usuarios.php"
      );

      const data = await response.json();

      if (!Array.isArray(data)) {
        setError("No se pudieron cargar los coordinadores.");
        return;
      }

      const soloCoordinadores = data.filter(
        (usuario) => usuario.rol === "coordinador" && usuario.estado === "activo"
      );

      setCoordinadores(soloCoordinadores);
    } catch (error) {
      console.error("Error cargando coordinadores:", error);
      setError("Error al cargar coordinadores.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const nuevoForm = {
        ...prev,
        [name]: value,
      };

      if (name === "rol" && (value === "admin" || value === "coordinador")) {
        nuevoForm.coordinador_id = "";
      }

      return nuevoForm;
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
      form.password.trim() === "" ||
      form.fecha_vigencia === ""
    ) {
      setError("Completa nombre, correo, contraseña y fecha de vigencia.");
      return;
    }

    if (
      (form.rol === "consulta" || form.rol === "operador") &&
      form.coordinador_id === ""
    ) {
      setError("Debes asignar un coordinador para consulta o operador.");
      return;
    }

    const payload = {
      nombre: form.nombre,
      email: form.email,
      password: form.password,
      rol: form.rol,
      estado: form.estado,
      fecha_vigencia: form.fecha_vigencia,
      coordinador_id:
        form.rol === "consulta" || form.rol === "operador"
          ? Number(form.coordinador_id)
          : null,
    };

    try {
      const response = await fetch(
        "/api/crear_usuario.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMensaje(data.mensaje);
        setError("");

        setForm({
          nombre: "",
          email: "",
          password: "",
          rol: "consulta",
          estado: "activo",
          fecha_vigencia: "",
          coordinador_id: "",
        });

        setTimeout(() => {
          navigate("/admin");
        }, 800);
      } else {
        setError(data.mensaje || "No se pudo crear el usuario.");
      }
    } catch (error) {
      console.error("Error creando usuario:", error);
      setError("Error de conexión con el servidor.");
    }
  };

  if (!usuarioActual) {
    return <div className="container mt-5">Cargando...</div>;
  }

  return (
    <div className="container mt-5">
      <h1>Crear usuario</h1>

      {mensaje && <div className="alert alert-success mt-4">{mensaje}</div>}
      {error && <div className="alert alert-danger mt-4">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="mb-3">
          <label className="form-label">Nombre</label>
          <input
            type="text"
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

        <div className="mb-3">
          <label className="form-label">Contraseña</label>
          <input
            type="password"
            name="password"
            className="form-control"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Rol</label>
          <select
            name="rol"
            className="form-select"
            value={form.rol}
            onChange={handleChange}
          >
            <option value="consulta">Consulta</option>
            <option value="operador">operador</option>
            <option value="coordinador">Coordinador</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {(form.rol === "consulta" || form.rol === "operador") && (
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

            {coordinadores.length === 0 && (
              <small className="text-danger">
                No hay coordinadores activos disponibles.
              </small>
            )}
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
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="revocado">Revocado</option>
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

        <button type="submit" className="btn btn-success me-2">
          Guardar
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate("/admin")}
        >
          Cancelar
        </button>
      </form>
    </div>
  );
}

export default CrearUsuario;



