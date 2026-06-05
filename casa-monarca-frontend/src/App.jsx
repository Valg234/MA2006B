import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import CrearUsuario from "./pages/CrearUsuario.jsx";
import EditarUsuario from "./pages/EditarUsuario.jsx";
import VerificacionCoordinador from "./pages/VerificacionCoordinador.jsx";
import CrearMigrante from "./pages/CrearMigrante.jsx";
import Migrantes from "./pages/Migrantes.jsx";
import SolicitudesPush from "./pages/SolicitudesPush.jsx";
import GestorDocumentos from "./pages/GestorDocumentos.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/verificacion-coordinador"
          element={<VerificacionCoordinador />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={["admin", "coordinador", "consulta", "operador"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin", "coordinador"]}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        <Route
          path="/crear-usuario"
          element={
            <ProtectedRoute roles={["admin"]}>
              <CrearUsuario />
            </ProtectedRoute>
          }
        />

        <Route
          path="/editar-usuario/:id"
          element={
            <ProtectedRoute roles={["admin", "coordinador"]}>
              <EditarUsuario />
            </ProtectedRoute>
          }
        />

        <Route
          path="/crear-migrante"
          element={
            <ProtectedRoute roles={["admin", "coordinador", "operador"]}>
              <CrearMigrante />
            </ProtectedRoute>
          }
        />

        <Route
          path="/migrantes"
          element={
            <ProtectedRoute roles={["admin", "coordinador", "consulta", "operador"]}>
              <Migrantes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/solicitudes"
          element={
            <ProtectedRoute roles={["admin", "coordinador", "operador"]}>
              <SolicitudesPush />
            </ProtectedRoute>
          }
        />

        <Route
          path="/documentos"
          element={
            <ProtectedRoute roles={["admin", "coordinador", "consulta", "operador"]}>
              <GestorDocumentos />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

