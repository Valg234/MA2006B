<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

include("../conexion.php");

$data = json_decode(file_get_contents("php://input"), true);

$usuario_id = $data["usuario_id"] ?? null;
$rol = $data["rol"] ?? "";
$datos = $data["datos"] ?? null;

if (!$usuario_id || !$datos || !in_array($rol, ["admin", "coordinador"])) {
    echo json_encode(["success" => false, "mensaje" => "No autorizado"]);
    exit();
}

$nombre = $datos["nombre"] ?? "";
$apellido_paterno = $datos["apellido_paterno"] ?? null;
$apellido_materno = $datos["apellido_materno"] ?? null;
$fecha_nacimiento = $datos["fecha_nacimiento"] ?? null;
$edad = $datos["edad"] !== "" ? intval($datos["edad"]) : null;
$sexo = $datos["sexo"] ?? "no_especificado";
$nacionalidad = $datos["nacionalidad"] ?? null;
$telefono = $datos["telefono"] ?? null;
$email = $datos["email"] ?? null;
$pais_origen = $datos["pais_origen"] ?? null;
$estado_origen = $datos["estado_origen"] ?? null;
$ciudad_origen = $datos["ciudad_origen"] ?? null;
$pais_destino = $datos["pais_destino"] ?? null;
$estado_destino = $datos["estado_destino"] ?? null;
$ciudad_destino = $datos["ciudad_destino"] ?? null;
$estatus_migratorio = $datos["estatus_migratorio"] ?? null;
$motivo_atencion = $datos["motivo_atencion"] ?? null;
$observaciones = $datos["observaciones"] ?? null;
$solicitud_id = null;

if ($nombre === "") {
    echo json_encode(["success" => false, "mensaje" => "El nombre es obligatorio"]);
    exit();
}

$stmt = $conexion->prepare("
    INSERT INTO migrantes (
        nombre, apellido_paterno, apellido_materno, fecha_nacimiento, edad,
        sexo, nacionalidad, telefono, email,
        pais_origen, estado_origen, ciudad_origen,
        pais_destino, estado_destino, ciudad_destino,
        estatus_migratorio, motivo_atencion, observaciones,
        creado_por, solicitud_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");

$stmt->bind_param(
    "ssssisssssssssssssii",
    $nombre,
    $apellido_paterno,
    $apellido_materno,
    $fecha_nacimiento,
    $edad,
    $sexo,
    $nacionalidad,
    $telefono,
    $email,
    $pais_origen,
    $estado_origen,
    $ciudad_origen,
    $pais_destino,
    $estado_destino,
    $ciudad_destino,
    $estatus_migratorio,
    $motivo_atencion,
    $observaciones,
    $usuario_id,
    $solicitud_id
);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "mensaje" => "Migrante registrado correctamente"]);
} else {
    echo json_encode(["success" => false, "mensaje" => "Error al registrar migrante", "error" => $stmt->error]);
}

