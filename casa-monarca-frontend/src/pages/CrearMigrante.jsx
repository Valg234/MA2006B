import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function CrearMigrante() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);

  const [form, setForm] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    fecha_nacimiento: "",
    edad: "",
    sexo: "no_especificado",
    nacionalidad: "",
    telefono: "",
    email: "",
    pais_origen: "",
    estado_origen: "",
    ciudad_origen: "",
    pais_destino: "",
    estado_destino: "",
    ciudad_destino: "",
    estatus_migratorio: "",
    motivo_atencion: "",
    observaciones: "",
  });

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
  }, [navigate]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const limpiarFormulario = () => {
    setForm({
      nombre: "",
      apellido_paterno: "",
      apellido_materno: "",
      fecha_nacimiento: "",
      edad: "",
      sexo: "no_especificado",
      nacionalidad: "",
      telefono: "",
      email: "",
      pais_origen: "",
      estado_origen: "",
      ciudad_origen: "",
      pais_destino: "",
      estado_destino: "",
      ciudad_destino: "",
      estatus_migratorio: "",
      motivo_atencion: "",
      observaciones: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!usuario) return;

    const endpoint =
      usuario.rol === "operador"
        ? "crear_solicitud_push.php"
        : "crear_migrante_directo.php";

    const payload =
      usuario.rol === "operador"
        ? {
          usuario_id: usuario.id,
          tipo_solicitud: "crear_migrante",
          datos_json: form,
        }
        : {
          usuario_id: usuario.id,
          rol: usuario.rol,
          datos: form,
        };

    try {
      const response = await fetch(
        `/api/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      alert(data.mensaje);

      if (data.success) {
        limpiarFormulario();
        navigate(usuario.rol === "operador" ? "/solicitudes" : "/migrantes");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar");
    }
  };

  if (!usuario) {
    return <div className="container mt-5">Cargando...</div>;
  }

  return (
    <div className="container mt-5">
      <h3>
        {usuario.rol === "operador"
          ? "Crear solicitud de registro"
          : "Crear registro de migrante"}
      </h3>

      {usuario.rol === "operador" && (
        <div className="alert alert-info mt-3">
          Tu registro no se insertará directamente. Se enviará como solicitud
          al coordinador asignado.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="row">
          <div className="col-md-4 mb-3">
            <label>Nombre</label>
            <input
              name="nombre"
              className="form-control"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-4 mb-3">
            <label>Apellido paterno</label>
            <input
              name="apellido_paterno"
              className="form-control"
              value={form.apellido_paterno}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4 mb-3">
            <label>Apellido materno</label>
            <input
              name="apellido_materno"
              className="form-control"
              value={form.apellido_materno}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4 mb-3">
            <label>Fecha de nacimiento</label>
            <input
              type="date"
              name="fecha_nacimiento"
              className="form-control"
              value={form.fecha_nacimiento}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4 mb-3">
            <label>Edad</label>
            <input
              type="number"
              name="edad"
              className="form-control"
              value={form.edad}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4 mb-3">
            <label>Sexo</label>
            <select
              name="sexo"
              className="form-control"
              value={form.sexo}
              onChange={handleChange}
            >
              <option value="no_especificado">No especificado</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="col-md-4 mb-3">
            <label>Nacionalidad</label>
            <input
              name="nacionalidad"
              className="form-control"
              value={form.nacionalidad}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4 mb-3">
            <label>Teléfono</label>
            <input
              name="telefono"
              className="form-control"
              value={form.telefono}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4 mb-3">
            <label>Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4 mb-3">
            <label>País de origen</label>
            <input
              name="pais_origen"
              className="form-control"
              value={form.pais_origen}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4 mb-3">
            <label>Estado de origen</label>
            <input
              name="estado_origen"
              className="form-control"
              value={form.estado_origen}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4 mb-3">
            <label>Ciudad de origen</label>
            <input
              name="ciudad_origen"
              className="form-control"
              value={form.ciudad_origen}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4 mb-3">
            <label>País destino</label>
            <input
              name="pais_destino"
              className="form-control"
              value={form.pais_destino}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4 mb-3">
            <label>Estado destino</label>
            <input
              name="estado_destino"
              className="form-control"
              value={form.estado_destino}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4 mb-3">
            <label>Ciudad destino</label>
            <input
              name="ciudad_destino"
              className="form-control"
              value={form.ciudad_destino}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6 mb-3">
            <label>Estatus migratorio</label>
            <input
              name="estatus_migratorio"
              className="form-control"
              value={form.estatus_migratorio}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6 mb-3">
            <label>Motivo de atención</label>
            <textarea
              name="motivo_atencion"
              className="form-control"
              value={form.motivo_atencion}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-12 mb-3">
            <label>Observaciones</label>
            <textarea
              name="observaciones"
              className="form-control"
              value={form.observaciones}
              onChange={handleChange}
            />
          </div>
        </div>

        <button className="btn btn-success">
          {usuario.rol === "operador" ? "Enviar solicitud" : "Guardar registro"}
        </button>

        <button
          type="button"
          className="btn btn-secondary ms-2"
          onClick={() => navigate("/dashboard")}
        >
          Volver
        </button>
      </form>
    </div>
  );
}

export default CrearMigrante;



