<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

include("../conexion.php");

$usuario_id = $_GET["usuario_id"] ?? null;
$rol = $_GET["rol"] ?? "";

if (!$usuario_id || $rol === "") {
    echo json_encode([]);
    exit();
}

if ($rol === "admin") {
    $stmt = $conexion->prepare("
        SELECT sp.*, u.nombre AS usuario_nombre, c.nombre AS coordinador_nombre
        FROM solicitudes_push sp
        LEFT JOIN usuarios u ON sp.usuario_id = u.id
        LEFT JOIN usuarios c ON sp.coordinador_id = c.id
        ORDER BY sp.creado_en DESC
    ");
} elseif ($rol === "coordinador") {
    $stmt = $conexion->prepare("
        SELECT sp.*, u.nombre AS usuario_nombre, c.nombre AS coordinador_nombre
        FROM solicitudes_push sp
        LEFT JOIN usuarios u ON sp.usuario_id = u.id
        LEFT JOIN usuarios c ON sp.coordinador_id = c.id
        WHERE sp.coordinador_id = ?
        ORDER BY sp.creado_en DESC
    ");
    $stmt->bind_param("i", $usuario_id);
} else {
    $stmt = $conexion->prepare("
        SELECT sp.*, u.nombre AS usuario_nombre, c.nombre AS coordinador_nombre
        FROM solicitudes_push sp
        LEFT JOIN usuarios u ON sp.usuario_id = u.id
        LEFT JOIN usuarios c ON sp.coordinador_id = c.id
        WHERE sp.usuario_id = ?
        ORDER BY sp.creado_en DESC
    ");
    $stmt->bind_param("i", $usuario_id);
}

$stmt->execute();
$result = $stmt->get_result();

$solicitudes = [];

while ($row = $result->fetch_assoc()) {
    $row["datos_json"] = json_decode($row["datos_json"], true);
    $solicitudes[] = $row;
}

echo json_encode($solicitudes);

