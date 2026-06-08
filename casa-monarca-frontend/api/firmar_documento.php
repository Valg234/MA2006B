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
$coordinadores_adicionales = $data["coordinadores_adicionales"] ?? [];

if (!$documento_id || !$usuario_id || trim($password_firma) === "") {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Datos incompletos"]);
    exit();
}

/* Buscar coordinador que firma */
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
    SELECT id, titulo, etapa, coordinador_id, archivo_ruta, hash_archivo, estado_documento
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

/* Bloquear documentos rechazados */
if ($doc["estado_documento"] === "rechazado") {
    ob_clean();
    echo json_encode([
        "success" => false,
        "mensaje" => "No se puede firmar un documento rechazado"
    ]);
    exit();
}

/*
  Reglas:
  - Si está en O, solo firma el coordinador principal.
  - Si está en C, puede firmar un coordinador adicional pendiente.
*/
if ($doc["etapa"] === "O") {
    if (intval($doc["coordinador_id"]) !== intval($usuario_id)) {
        ob_clean();
        echo json_encode(["success" => false, "mensaje" => "Este documento no pertenece a este coordinador"]);
        exit();
    }
} else if ($doc["etapa"] === "C") {
    $stmtPendiente = $conexion->prepare("
        SELECT id, estado
        FROM documentos_firmas
        WHERE documento_id = ?
          AND coordinador_id = ?
        LIMIT 1
    ");

    $stmtPendiente->bind_param("ii", $documento_id, $usuario_id);
    $stmtPendiente->execute();
    $resPendiente = $stmtPendiente->get_result();

    if ($resPendiente->num_rows === 0) {
        ob_clean();
        echo json_encode(["success" => false, "mensaje" => "No tienes una firma pendiente para este documento"]);
        exit();
    }

    $firmaPendiente = $resPendiente->fetch_assoc();

    if ($firmaPendiente["estado"] === "firmado") {
        ob_clean();
        echo json_encode(["success" => false, "mensaje" => "Este coordinador ya firmó el documento"]);
        exit();
    }
} else {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "El documento no está en una etapa válida para firma"]);
    exit();
}

/* Obtener o generar hash */
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

/* Firmar hash */
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

$folio_firma = "FIR-" . date("Ymd-His") . "-DOC" . $documento_id . "-USR" . $usuario_id;
$accion_firma = "El coordinador firmó digitalmente el documento";

/* Insertar o actualizar la firma del coordinador actual */
$stmtFirma = $conexion->prepare("
    INSERT INTO documentos_firmas
    (documento_id, coordinador_id, solicitado_por, estado, hash_archivo, firma, folio_firma, accion_firma, fecha_firma)
    VALUES (?, ?, ?, 'firmado', ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
        estado = 'firmado',
        hash_archivo = VALUES(hash_archivo),
        firma = VALUES(firma),
        folio_firma = VALUES(folio_firma),
        accion_firma = VALUES(accion_firma),
        fecha_firma = NOW()
");

$stmtFirma->bind_param(
    "iiissss",
    $documento_id,
    $usuario_id,
    $usuario_id,
    $hash_archivo,
    $firmaBase64,
    $folio_firma,
    $accion_firma
);

if (!$stmtFirma->execute()) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "No se pudo guardar la firma múltiple"]);
    exit();
}

/* Mantener compatibilidad con columnas antiguas del documento */
$stmtLegacy = $conexion->prepare("
    UPDATE documentos
    SET firma_coordinador = IF(firma_coordinador IS NULL, ?, firma_coordinador),
        folio_firma = IF(folio_firma IS NULL, ?, folio_firma),
        accion_firma = IF(accion_firma IS NULL, ?, accion_firma),
        firmado_por = IF(firmado_por IS NULL, ?, firmado_por),
        fecha_firma = IF(fecha_firma IS NULL, NOW(), fecha_firma),
        etapa = 'C'
    WHERE id = ?
");

$stmtLegacy->bind_param(
    "sssii",
    $firmaBase64,
    $folio_firma,
    $accion_firma,
    $usuario_id,
    $documento_id
);

$stmtLegacy->execute();

/* Agregar coordinadores adicionales como pendientes */
$agregados = [];

if (is_array($coordinadores_adicionales)) {
    foreach ($coordinadores_adicionales as $coord_extra) {
        $coord_extra = intval($coord_extra);

        if ($coord_extra <= 0 || $coord_extra === intval($usuario_id)) {
            continue;
        }

        $stmtExtra = $conexion->prepare("
            INSERT IGNORE INTO documentos_firmas
            (documento_id, coordinador_id, solicitado_por, estado)
            VALUES (?, ?, ?, 'pendiente')
        ");

        $stmtExtra->bind_param("iii", $documento_id, $coord_extra, $usuario_id);

        if ($stmtExtra->execute()) {
            $agregados[] = $coord_extra;
        }
    }
}

/* Historial */
$comentario = "Documento firmado por coordinador. Folio: " . $folio_firma;

if (count($agregados) > 0) {
    $comentario .= ". Se solicitaron firmas adicionales.";
}

$etapaAnterior = $doc["etapa"];
$etapaNueva = "C";

$stmtHist = $conexion->prepare("
    INSERT INTO documentos_historial
    (documento_id, etapa_anterior, etapa_nueva, usuario_id, comentario)
    VALUES (?, ?, ?, ?, ?)
");

$stmtHist->bind_param("issis", $documento_id, $etapaAnterior, $etapaNueva, $usuario_id, $comentario);
$stmtHist->execute();

ob_clean();

echo json_encode([
    "success" => true,
    "mensaje" => "Documento firmado correctamente",
    "etapa" => "C",
    "folio_firma" => $folio_firma,
    "coordinadores_adicionales" => $agregados
]);

exit();