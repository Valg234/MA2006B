import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function AdminPanel() {
  const navigate = useNavigate();

  const [usuarioActual, setUsuarioActual] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargarUsuarios = async (usuarioSesion) => {
    try {
      setError("");
      setLoading(true);

      const url =
        usuarioSesion.rol === "coordinador"
          ? `/api/usuarios.php?usuario_id=${usuarioSesion.id}&rol=${usuarioSesion.rol}`
          : "/api/usuarios.php";

      const response = await fetch(url);

      const texto = await response.text();
      console.log("RAW usuarios.php:", texto);

      let data;

      try {
        data = JSON.parse(texto);
      } catch (error) {
        console.error("Respuesta no JSON de usuarios.php:", texto);
        setError("La respuesta del servidor no es JSON válido.");
        setUsuarios([]);
        return;
      }

      if (!Array.isArray(data)) {
        setError(data.mensaje || "Error al cargar usuarios.");
        setUsuarios([]);
        return;
      }

      setUsuarios(data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      setError("Error de conexión al cargar usuarios.");
      setUsuarios([]);
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

    if (
      usuarioParseado.rol !== "admin" &&
      usuarioParseado.rol !== "coordinador"
    ) {
      navigate("/dashboard");
      return;
    }

    setUsuarioActual(usuarioParseado);
    cargarUsuarios(usuarioParseado);
  }, [navigate]);

  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    navigate("/");
  };

  const eliminarUsuario = async (id) => {
    if (!usuarioActual || usuarioActual.rol !== "admin") {
      alert("No tienes permiso para eliminar usuarios.");
      return;
    }

    const confirmar = window.confirm("¿Seguro que deseas eliminar este usuario?");
    if (!confirmar) return;

    try {
      const response = await fetch(
        "/api/eliminar_usuario.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        }
      );

      const texto = await response.text();
      console.log("RAW eliminar_usuario.php:", texto);

      let data;

      try {
        data = JSON.parse(texto);
      } catch (error) {
        alert("Respuesta inválida del servidor.");
        return;
      }

      alert(data.mensaje);

      if (data.success) {
        cargarUsuarios(usuarioActual);
      }
    } catch (error) {
      console.error("Error eliminando usuario:", error);
      alert("Error de conexión al eliminar usuario.");
    }
  };

  if (!usuarioActual || loading) {
    return <div className="container mt-5">Cargando panel...</div>;
  }

  return (
    <div className="container mt-5">
      <div className="card shadow p-4">
        <h1 className="mb-4">Panel de Administración</h1>

        <p>
          <strong>Sesión actual:</strong> {usuarioActual.nombre} |{" "}
          <strong>Rol:</strong>{" "}
          <span className="badge bg-danger">{usuarioActual.rol}</span>
        </p>

        {error && <div className="alert alert-danger mt-3">{error}</div>}

        <div className="mt-3 mb-4 d-flex gap-2 flex-wrap">
          <Link to="/dashboard" className="btn btn-secondary">
            Dashboard
          </Link>

          {usuarioActual.rol === "admin" && (
            <Link to="/crear-usuario" className="btn btn-success">
              Crear usuario
            </Link>
          )}

          <button onClick={cerrarSesion} className="btn btn-danger">
            Cerrar sesión
          </button>
        </div>

        <h2 className="mb-3">Lista de usuarios</h2>

        <div className="table-responsive">
          <table className="table table-bordered table-striped align-middle">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Vigencia</th>
                <th>Certificado</th>
                <th>Coordinador</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center">
                    No hay usuarios registrados.
                  </td>
                </tr>
              ) : (
                usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>{usuario.id}</td>
                    <td>{usuario.nombre}</td>
                    <td>{usuario.email}</td>
                    <td>
                      <span className="badge bg-primary">{usuario.rol}</span>
                    </td>
                    <td>{usuario.estado}</td>
                    <td>{usuario.fecha_vigencia}</td>
                    <td>{usuario.certificado_codigo}</td>
                    <td>
                      {usuario.coordinador_nombre
                        ? usuario.coordinador_nombre
                        : usuario.coordinador_id
                          ? `ID ${usuario.coordinador_id}`
                          : "-"}
                    </td>
                    <td>
                      <Link
                        to={`/editar-usuario/${usuario.id}`}
                        className="btn btn-warning btn-sm me-2"
                      >
                        Editar
                      </Link>

                      {usuarioActual.rol === "admin" && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => eliminarUsuario(usuario.id)}
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {usuarioActual.rol === "coordinador" && (
          <div className="alert alert-info mt-3">
            Como coordinador, solo puedes ver y editar los usuarios asignados a
            ti. No puedes crear ni eliminar usuarios.
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;



