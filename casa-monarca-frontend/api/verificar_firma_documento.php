<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

include("../conexion.php");

$documento_id = $_GET["documento_id"] ?? null;

if (!$documento_id) {
    echo json_encode(["success" => false, "mensaje" => "Documento no especificado"]);
    exit();
}

$stmt = $conexion->prepare("
    SELECT 
        d.id,
        d.titulo,
        d.hash_archivo,
        d.firma_coordinador,
        d.firmado_por,
        u.nombre AS coordinador_nombre,
        u.clave_publica
    FROM documentos d
    LEFT JOIN usuarios u ON d.firmado_por = u.id
    WHERE d.id = ?
    LIMIT 1
");

$stmt->bind_param("i", $documento_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "mensaje" => "Documento no encontrado"]);
    exit();
}

$doc = $result->fetch_assoc();

if (empty($doc["hash_archivo"]) || empty($doc["firma_coordinador"]) || empty($doc["clave_publica"])) {
    echo json_encode(["success" => false, "mensaje" => "El documento no tiene firma completa"]);
    exit();
}

$valido = openssl_verify(
    $doc["hash_archivo"],
    base64_decode($doc["firma_coordinador"]),
    $doc["clave_publica"],
    OPENSSL_ALGO_SHA256
);

if ($valido === 1) {
    echo json_encode([
        "success" => true,
        "firma_valida" => true,
        "mensaje" => "Firma válida",
        "coordinador" => $doc["coordinador_nombre"]
    ]);
} else {
    echo json_encode([
        "success" => true,
        "firma_valida" => false,
        "mensaje" => "Firma inválida"
    ]);
}