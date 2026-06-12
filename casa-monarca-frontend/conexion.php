<?php
$host = "localhost";
$usuario = "casa_monarca_user";
$password = "casa_monarca_pass";
$base_datos = "casa_monarca";

// SEGURIDAD: reemplaza estas credenciales por las de tu entorno antes de ejecutar
// o desplegar el proyecto. Nunca publiques credenciales reales en el repositorio.
$conexion = new mysqli($host, $usuario, $password, $base_datos);

if ($conexion->connect_error) {
    die(json_encode([
        "success" => false,
        "mensaje" => "Error de conexión a la base de datos: " . $conexion->connect_error
    ]));
}

$conexion->set_charset("utf8");
?>
