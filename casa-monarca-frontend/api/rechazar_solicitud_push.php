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

$id = $data["id"] ?? null;
$usuario_id = $data["usuario_id"] ?? null;
$rol = $data["rol"] ?? "";
$comentario = $data["comentario"] ?? "";

if (!$id || !$usuario_id || !in_array($rol, ["admin", "coordinador"])) {
    echo json_encode(["success" => false, "mensaje" => "No autorizado"]);
    exit();
}

$stmt = $conexion->prepare("SELECT * FROM solicitudes_push WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "mensaje" => "Solicitud no encontrada"]);
    exit();
}

$solicitud = $result->fetch_assoc();

if ($rol === "coordinador" && intval($solicitud["coordinador_id"]) !== intval($usuario_id)) {
    echo json_encode(["success" => false, "mensaje" => "No puedes rechazar esta solicitud"]);
    exit();
}

if ($solicitud["estado"] !== "pendiente") {
    echo json_encode(["success" => false, "mensaje" => "Solicitud ya procesada"]);
    exit();
}

$stmt = $conexion->prepare("
    UPDATE solicitudes_push
    SET estado = 'rechazada', comentario = ?, revisado_en = NOW()
    WHERE id = ?
");

$stmt->bind_param("si", $comentario, $id);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "mensaje" => "Solicitud rechazada"]);
} else {
    echo json_encode(["success" => false, "mensaje" => "Error al rechazar"]);
}

