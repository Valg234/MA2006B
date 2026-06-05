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
$tipo_solicitud = $data["tipo_solicitud"] ?? "";
$datos_json = $data["datos_json"] ?? null;

if (!$usuario_id || $tipo_solicitud === "" || !$datos_json) {
    echo json_encode(["success" => false, "mensaje" => "Datos incompletos"]);
    exit();
}

$stmt = $conexion->prepare("SELECT id, rol, coordinador_id FROM usuarios WHERE id = ?");
$stmt->bind_param("i", $usuario_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "mensaje" => "Usuario no encontrado"]);
    exit();
}

$usuario = $result->fetch_assoc();

if ($usuario["rol"] !== "operador") {
    echo json_encode(["success" => false, "mensaje" => "Solo operador genera solicitudes"]);
    exit();
}

$coordinador_id = $usuario["coordinador_id"];

if (!$coordinador_id) {
    echo json_encode(["success" => false, "mensaje" => "Este capturista no tiene coordinador asignado"]);
    exit();
}

$json_string = json_encode($datos_json);

$stmt = $conexion->prepare("
    INSERT INTO solicitudes_push (
        usuario_id,
        coordinador_id,
        tipo_solicitud,
        datos_json,
        estado
    ) VALUES (?, ?, ?, ?, 'pendiente')
");

$stmt->bind_param("iiss", $usuario_id, $coordinador_id, $tipo_solicitud, $json_string);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "mensaje" => "Solicitud enviada al coordinador"]);
} else {
    echo json_encode(["success" => false, "mensaje" => "Error al crear solicitud", "error" => $stmt->error]);
}

