<?php
ob_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

include("../conexion.php");

$data = json_decode(file_get_contents("php://input"), true);

$documento_id = $data["documento_id"] ?? null;
$usuario_id = $data["usuario_id"] ?? null;

if (!$documento_id || !$usuario_id) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Datos incompletos"]);
    exit();
}

/* Validar admin */
$stmtUsuario = $conexion->prepare("
    SELECT id, rol
    FROM usuarios
    WHERE id = ?
    LIMIT 1
");

$stmtUsuario->bind_param("i", $usuario_id);
$stmtUsuario->execute();
$resUsuario = $stmtUsuario->get_result();

if ($resUsuario->num_rows === 0) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Usuario no encontrado"]);
    exit();
}

$usuario = $resUsuario->fetch_assoc();

if (strtolower($usuario["rol"]) !== "admin") {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Solo admin puede eliminar documentos"]);
    exit();
}

/* Buscar documento */
$stmtDoc = $conexion->prepare("
    SELECT id, archivo_ruta
    FROM documentos
    WHERE id = ?
    LIMIT 1
");

$stmtDoc->bind_param("i", $documento_id);
$stmtDoc->execute();
$resDoc = $stmtDoc->get_result();

if ($resDoc->num_rows === 0) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Documento no encontrado"]);
    exit();
}

$doc = $resDoc->fetch_assoc();

/* Borrar relaciones */
$stmtFirmas = $conexion->prepare("DELETE FROM documentos_firmas WHERE documento_id = ?");
$stmtFirmas->bind_param("i", $documento_id);
$stmtFirmas->execute();

$stmtHist = $conexion->prepare("DELETE FROM documentos_historial WHERE documento_id = ?");
$stmtHist->bind_param("i", $documento_id);
$stmtHist->execute();

/* Borrar documento */
$stmtDelete = $conexion->prepare("DELETE FROM documentos WHERE id = ?");
$stmtDelete->bind_param("i", $documento_id);

if (!$stmtDelete->execute()) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "No se pudo eliminar el documento"]);
    exit();
}

/* Borrar archivo físico si existe */
if (!empty($doc["archivo_ruta"])) {
    $rutaArchivo = "../" . $doc["archivo_ruta"];

    if (file_exists($rutaArchivo)) {
        unlink($rutaArchivo);
    }
}

ob_clean();

echo json_encode([
    "success" => true,
    "mensaje" => "Documento eliminado correctamente"
]);

exit();