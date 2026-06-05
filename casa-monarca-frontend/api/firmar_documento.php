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
$password_firma = $data["password_firma"] ?? "";

if (!$documento_id || !$usuario_id || trim($password_firma) === "") {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Datos incompletos"]);
    exit();
}

/* Buscar coordinador */
$stmtUsuario = $conexion->prepare("
    SELECT id, nombre, rol, clave_publica, clave_privada_cifrada
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

if (strtolower($usuario["rol"]) !== "coordinador") {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Solo un coordinador puede firmar"]);
    exit();
}

if (empty($usuario["clave_privada_cifrada"]) || empty($usuario["clave_publica"])) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "El coordinador no tiene llaves generadas"]);
    exit();
}

/* Buscar documento */
$stmtDoc = $conexion->prepare("
    SELECT id, titulo, etapa, coordinador_id, archivo_ruta, hash_archivo
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

if ($doc["etapa"] !== "O") {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "El documento debe estar en etapa Operador para poder firmarse"]);
    exit();
}

if (intval($doc["coordinador_id"]) !== intval($usuario_id)) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Este documento no pertenece a este coordinador"]);
    exit();
}

$hash_archivo = $doc["hash_archivo"];

if (empty($hash_archivo)) {
    if (empty($doc["archivo_ruta"])) {
        ob_clean();
        echo json_encode(["success" => false, "mensaje" => "El documento no tiene archivo asociado"]);
        exit();
    }

    $rutaArchivo = "../" . $doc["archivo_ruta"];

    if (!file_exists($rutaArchivo)) {
        ob_clean();
        echo json_encode([
            "success" => false,
            "mensaje" => "No se encontró el archivo físico para generar el hash"
        ]);
        exit();
    }

    $hash_archivo = hash_file("sha256", $rutaArchivo);

    $stmtHash = $conexion->prepare("
        UPDATE documentos
        SET hash_archivo = ?
        WHERE id = ?
    ");

    $stmtHash->bind_param("si", $hash_archivo, $documento_id);
    $stmtHash->execute();
}

/* Abrir clave privada con contraseña */
$clavePrivada = openssl_pkey_get_private(
    $usuario["clave_privada_cifrada"],
    $password_firma
);

if (!$clavePrivada) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Contraseña de firma incorrecta"]);
    exit();
}

/* Firmar el hash del archivo */
$firmaOk = openssl_sign(
    $hash_archivo,
    $firmaBinaria,
    $clavePrivada,
    OPENSSL_ALGO_SHA256
);
if (!$firmaOk) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "No se pudo firmar el documento"]);
    exit();
}

$firmaBase64 = base64_encode($firmaBinaria);

/* Crear folio/ticket de firma */
$folio_firma = "FIR-" . date("Ymd-His") . "-DOC" . $documento_id . "-USR" . $usuario_id;
$accion_firma = "El coordinador firmó digitalmente el documento y lo avanzó de Operador a Coordinador";

/* Guardar firma, folio y avanzar O -> C */
$stmtUpdate = $conexion->prepare("
    UPDATE documentos
    SET firma_coordinador = ?,
        folio_firma = ?,
        accion_firma = ?,
        firmado_por = ?,
        fecha_firma = NOW(),
        etapa = 'C'
    WHERE id = ?
");

$stmtUpdate->bind_param(
    "sssii",
    $firmaBase64,
    $folio_firma,
    $accion_firma,
    $usuario_id,
    $documento_id
);

if (!$stmtUpdate->execute()) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "No se pudo guardar la firma"]);
    exit();
}

/* Historial */
$comentario = "Documento firmado por coordinador. Folio: " . $folio_firma;

$stmtHist = $conexion->prepare("
    INSERT INTO documentos_historial
    (documento_id, etapa_anterior, etapa_nueva, usuario_id, comentario)
    VALUES (?, 'O', 'C', ?, ?)
");

$stmtHist->bind_param("iis", $documento_id, $usuario_id, $comentario);
$stmtHist->execute();

ob_clean();

echo json_encode([
    "success" => true,
    "mensaje" => "Documento firmado correctamente",
    "etapa" => "C",
    "folio_firma" => $folio_firma
]);

exit();