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
        SELECT m.*, u.nombre AS creado_por_nombre
        FROM migrantes m
        LEFT JOIN usuarios u ON m.creado_por = u.id
        ORDER BY m.creado_en DESC
    ");
} elseif ($rol === "coordinador") {
    $stmt = $conexion->prepare("
        SELECT m.*, u.nombre AS creado_por_nombre
        FROM migrantes m
        LEFT JOIN usuarios u ON m.creado_por = u.id
        WHERE m.creado_por = ?
           OR m.creado_por IN (
                SELECT id FROM usuarios WHERE coordinador_id = ?
           )
        ORDER BY m.creado_en DESC
    ");
    $stmt->bind_param("ii", $usuario_id, $usuario_id);
} else {
    $stmt = $conexion->prepare("
        SELECT m.*, u.nombre AS creado_por_nombre
        FROM migrantes m
        LEFT JOIN usuarios u ON m.creado_por = u.id
        WHERE m.creado_por = ?
           OR m.creado_por IN (
                SELECT id FROM usuarios
                WHERE coordinador_id = (
                    SELECT coordinador_id FROM usuarios WHERE id = ?
                )
           )
        ORDER BY m.creado_en DESC
    ");
    $stmt->bind_param("ii", $usuario_id, $usuario_id);
}

$stmt->execute();
$result = $stmt->get_result();

$migrantes = [];

while ($row = $result->fetch_assoc()) {
    $migrantes[] = $row;
}

echo json_encode($migrantes);

