import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");

    if (!usuarioGuardado) {
      navigate("/");
      return;
    }

    try {
      setUsuario(JSON.parse(usuarioGuardado));
    } catch (error) {
      console.error("Error leyendo usuario:", error);
      navigate("/");
    }
  }, [navigate]);

  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    navigate("/");
  };

  if (!usuario) {
    return <div className="container mt-5">Cargando...</div>;
  }

  return (
    <div className="container mt-5">
      <h2>Dashboard Casa Monarca</h2>

      <div className="card mt-4">
        <div className="card-body">
          <h5>Bienvenido, {usuario.nombre}</h5>
          <p>
            <strong>Rol:</strong> {usuario.rol}
          </p>
          <p>
            <strong>Email:</strong> {usuario.email}
          </p>
        </div>
      </div>

      <div className="mt-4 d-flex gap-2 flex-wrap">
        <Link to="/migrantes" className="btn btn-primary">
          Ver registros
        </Link>

        {(usuario.rol === "admin" ||
          usuario.rol === "coordinador" ||
          usuario.rol === "operador") && (
          <Link to="/crear-migrante" className="btn btn-success">
            Crear registro
          </Link>
        )}

        {(usuario.rol === "admin" ||
          usuario.rol === "coordinador" ||
          usuario.rol === "operador") && (
          <Link to="/solicitudes" className="btn btn-warning">
            Solicitudes
          </Link>
        )}

        <Link to="/documentos" className="btn btn-info">
          Gestor de documentos
        </Link>

        {(usuario.rol === "admin" || usuario.rol === "coordinador") && (
          <Link to="/admin" className="btn btn-dark">
            Panel de usuarios
          </Link>
        )}

        <button onClick={cerrarSesion} className="btn btn-outline-danger">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default Dashboard;

