<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

include("../conexion.php");

$stmt = $conexion->prepare("
    SELECT id, nombre, email
    FROM usuarios
    WHERE rol = 'coordinador'
      AND estado = 'activo'
    ORDER BY nombre ASC
");

$stmt->execute();
$result = $stmt->get_result();

$coordinadores = [];

while ($row = $result->fetch_assoc()) {
    $coordinadores[] = $row;
}

echo json_encode([
    "success" => true,
    "coordinadores" => $coordinadores
]);