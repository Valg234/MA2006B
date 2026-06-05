<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

include("../conexion.php");

$usuario_id = $_GET["usuario_id"] ?? null;

if (!$usuario_id) {
    echo json_encode(["success" => false, "mensaje" => "Datos incompletos"]);
    exit();
}

/*
  Primero buscamos al usuario real desde BD.
  No confiamos solo en el rol que manda el frontend.
*/
$stmtUsuario = $conexion->prepare("
    SELECT id, nombre, email, rol, coordinador_id, clave_publica
    FROM usuarios
    WHERE id = ?
    LIMIT 1
");

$stmtUsuario->bind_param("i", $usuario_id);
$stmtUsuario->execute();
$resultUsuario = $stmtUsuario->get_result();

if ($resultUsuario->num_rows === 0) {
    echo json_encode(["success" => false, "mensaje" => "Usuario no encontrado"]);
    exit();
}

$usuario = $resultUsuario->fetch_assoc();
$rol = strtolower($usuario["rol"]);

/*
  Reglas de visualización:

  admin:
    ve todos los documentos

  coordinador:
    ve documentos asignados a él

  operador:
    ve documentos del coordinador al que pertenece

  consulta:
    ve documentos del coordinador al que pertenece
*/

if ($rol === "admin") {
    $stmt = $conexion->prepare("
        SELECT 
            d.*, 
            uc.nombre AS coordinador_nombre,
            uc.email AS coordinador_email,
            creador.nombre AS creado_por_nombre,
            creador.email AS creado_por_email,
	    firmante.nombre AS firmado_por_nombre,
	    firmante.email AS firmado_por_email
        FROM documentos d
        LEFT JOIN usuarios uc ON d.coordinador_id = uc.id
        LEFT JOIN usuarios creador ON d.creado_por = creador.id
	LEFT JOIN usuarios firmante ON d.firmado_por = firmante.id
        ORDER BY d.fecha_creacion DESC
    ");
} else if ($rol === "coordinador") {
    $stmt = $conexion->prepare("
        SELECT 
            d.*, 
            uc.nombre AS coordinador_nombre,
            uc.email AS coordinador_email,
            creador.nombre AS creado_por_nombre,
            creador.email AS creado_por_email,
	firmante.nombre AS firmado_por_nombre,
	firmante.email AS firmado_por_email
        FROM documentos d
        LEFT JOIN usuarios uc ON d.coordinador_id = uc.id
        LEFT JOIN usuarios creador ON d.creado_por = creador.id
	LEFT JOIN usuarios firmante ON d.firmado_por = firmante.id
        WHERE d.coordinador_id = ?
        ORDER BY d.fecha_creacion DESC
    ");

    $stmt->bind_param("i", $usuario["id"]);
} else if ($rol === "operador" || $rol === "consulta") {
    if (empty($usuario["coordinador_id"])) {
        echo json_encode([
            "success" => true,
            "documentos" => [],
            "mensaje" => "El usuario no tiene coordinador asignado"
        ]);
        exit();
    }

    $stmt = $conexion->prepare("
        SELECT 
            d.*, 
            uc.nombre AS coordinador_nombre,
            uc.email AS coordinador_email,
            creador.nombre AS creado_por_nombre,
            creador.email AS creado_por_email,
	firmante.nombre AS firmado_por_nombre,
	firmante.email AS firmado_por_email
        FROM documentos d
        LEFT JOIN usuarios uc ON d.coordinador_id = uc.id
        LEFT JOIN usuarios creador ON d.creado_por = creador.id
	LEFT JOIN usuarios firmante ON d.firmado_por = firmante.id
        WHERE d.coordinador_id = ?
        ORDER BY d.fecha_creacion DESC
    ");

    $stmt->bind_param("i", $usuario["coordinador_id"]);
} else {
    echo json_encode(["success" => false, "mensaje" => "Rol no autorizado"]);
    exit();
}

if (!$stmt->execute()) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Error consultando documentos",
        "error" => $conexion->error
    ]);
    exit();
}

$result = $stmt->get_result();

$documentos = [];

while ($row = $result->fetch_assoc()) {
    $documentos[] = $row;
}

echo json_encode([
    "success" => true,
    "usuario" => $usuario,
    "documentos" => $documentos
]);