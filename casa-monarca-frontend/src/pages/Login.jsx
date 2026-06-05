import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  const iniciarSesion = async (e) => {
    e.preventDefault();

    setMensaje("");
    setLoading(true);

    try {
      const response = await fetch(
        "/api/login.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const texto = await response.text();
      console.log("Respuesta cruda login:", texto);

      let data;

      try {
        data = JSON.parse(texto);
      } catch (error) {
        console.error("JSON inválido:", texto);
        setMensaje("Respuesta inválida del servidor.");
        return;
      }

      if (!data.success) {
        setMensaje(data.mensaje || "No se pudo iniciar sesión");
        return;
      }

      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      navigate("/dashboard");
    } catch (error) {
      console.error("Error en login:", error);
      setMensaje("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 d-flex justify-content-center">
      <div className="card shadow p-4" style={{ width: "450px" }}>
        <h1 className="text-center mb-4">Casa Monarca</h1>
        <h3 className="text-center mb-4">Iniciar sesión</h3>

        {mensaje && <div className="alert alert-danger">{mensaje}</div>}

        <form onSubmit={iniciarSesion}>
          <div className="mb-3">
            <label className="form-label">Correo electrónico</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;



