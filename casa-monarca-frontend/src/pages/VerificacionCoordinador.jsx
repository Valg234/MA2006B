import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function VerificacionCoordinador() {
  const [certificadoCodigo, setCertificadoCodigo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const userId = location.state?.userId || null;
  const email = location.state?.email || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!userId) {
      setError("No se encontró la sesión de verificación. Vuelve a iniciar sesión.");
      return;
    }

    if (!certificadoCodigo.trim() || !clave.trim()) {
      setError("Debes ingresar certificado y key.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/verificar_coordinador.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            certificado_codigo: certificadoCodigo.trim(),
            clave,
          }),
        }
      );

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("Error parseando JSON:", err);
        console.error("Respuesta cruda:", text);
        setError("Respuesta inválida del servidor.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError(data.mensaje || "Error del servidor.");
        setLoading(false);
        return;
      }

      if (data.success && data.usuario) {
        localStorage.setItem("usuario", JSON.stringify(data.usuario));
        navigate("/dashboard");
      } else {
        setError(data.mensaje || "No se pudo validar al coordinador.");
      }
    } catch (err) {
      console.error("Error al verificar coordinador:", err);
      setError("No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  };

  const volverAlLogin = () => {
    navigate("/");
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow" style={{ width: "430px" }}>
        <h2 className="text-center mb-3">Validación de coordinador</h2>
        <p className="text-center text-muted mb-4">
          {email ? `Usuario: ${email}` : "Ingresa tu certificado y key"}
        </p>

        {error && (
          <div className="alert alert-danger text-center">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Certificado</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej. COORD-CM-001"
              value={certificadoCodigo}
              onChange={(e) => setCertificadoCodigo(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Key</label>
            <input
              type="password"
              className="form-control"
              placeholder="Ingresa tu key"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="d-grid gap-2">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Verificando..." : "Verificar acceso"}
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={volverAlLogin}
              disabled={loading}
            >
              Volver al login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VerificacionCoordinador;



