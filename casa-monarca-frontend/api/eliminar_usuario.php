<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include("../conexion.php");

$data = json_decode(file_get_contents("php://input"), true);

$id = $data["id"] ?? null;

if (!$id) {
    echo json_encode([
        "success" => false,
        "mensaje" => "ID no proporcionado."
    ]);
    exit();
}

$sql = "DELETE FROM usuarios WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "mensaje" => "Usuario eliminado correctamente."
    ]);
} else {
    echo json_encode([
        "success" => false,
        "mensaje" => "Error al eliminar usuario."
    ]);
}

$stmt->close();
$conn->close();
?>

