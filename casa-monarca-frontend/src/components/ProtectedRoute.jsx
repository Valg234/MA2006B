import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, role, roles }) {
  const [loading, setLoading] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    const validar = async () => {
      const usuarioGuardado = localStorage.getItem("usuario");

      if (!usuarioGuardado) {
        setAutorizado(false);
        setLoading(false);
        return;
      }

      let usuario;
      try {
        usuario = JSON.parse(usuarioGuardado);
      } catch (error) {
        console.error("Error leyendo usuario desde localStorage:", error);
        localStorage.removeItem("usuario");
        setAutorizado(false);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "/api/validar_sesion.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: usuario.id,
              coordinador_validado: usuario.coordinador_validado || false,
            }),
          }
        );

        const rawText = await response.text();
        console.log("RAW validar_sesion:", rawText);

        let data;
        try {
          data = JSON.parse(rawText);
        } catch (err) {
          console.error("Error validando sesión: respuesta no JSON", err);
          localStorage.removeItem("usuario");
          setAutorizado(false);
          setLoading(false);
          return;
        }

        if (!response.ok || !data.success) {
          localStorage.removeItem("usuario");
          setAutorizado(false);
          setLoading(false);
          return;
        }

        const usuarioActualizado =
          data.usuario.rol === "coordinador"
            ? {
              ...data.usuario,
              coordinador_validado: usuario.coordinador_validado || false,
            }
            : data.usuario;

        localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));

        if (role && data.usuario.rol !== role) {
          setAutorizado(false);
          setLoading(false);
          return;
        }

        if (roles && !roles.includes(data.usuario.rol)) {
          setAutorizado(false);
          setLoading(false);
          return;
        }

        setAutorizado(true);
        setLoading(false);
      } catch (error) {
        console.error("Error validando sesión:", error);
        localStorage.removeItem("usuario");
        setAutorizado(false);
        setLoading(false);
      }
    };

    validar();
  }, [role, roles]);

  if (loading) {
    return <p className="text-center mt-5">Validando sesión...</p>;
  }

  if (!autorizado) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;



