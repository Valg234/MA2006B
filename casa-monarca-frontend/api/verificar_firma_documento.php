<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

include("../conexion.php");

$documento_id = $_GET["documento_id"] ?? null;

if (!$documento_id) {
    echo json_encode(["success" => false, "mensaje" => "Documento no especificado"]);
    exit();
}

$stmtDoc = $conexion->prepare("
    SELECT id, titulo, hash_archivo
    FROM documentos
    WHERE id = ?
    LIMIT 1
");

$stmtDoc->bind_param("i", $documento_id);
$stmtDoc->execute();
$resDoc = $stmtDoc->get_result();

if ($resDoc->num_rows === 0) {
    echo json_encode(["success" => false, "mensaje" => "Documento no encontrado"]);
    exit();
}

$doc = $resDoc->fetch_assoc();

$stmtFirmas = $conexion->prepare("
    SELECT
        df.id,
        df.estado,
        df.hash_archivo,
        df.firma,
        df.folio_firma,
        df.fecha_firma,
        u.nombre AS coordinador_nombre,
        u.email AS coordinador_email,
        u.clave_publica
    FROM documentos_firmas df
    LEFT JOIN usuarios u ON df.coordinador_id = u.id
    WHERE df.documento_id = ?
    ORDER BY df.fecha_solicitud ASC
");

$stmtFirmas->bind_param("i", $documento_id);
$stmtFirmas->execute();
$resFirmas = $stmtFirmas->get_result();

$firmas = [];
$todas_validas = true;
$hay_firmas = false;

while ($firma = $resFirmas->fetch_assoc()) {
    $estadoVerificacion = "pendiente";
    $valida = null;

    if ($firma["estado"] === "firmado") {
        $hay_firmas = true;

        if (empty($firma["hash_archivo"]) || empty($firma["firma"]) || empty($firma["clave_publica"])) {
            $valida = false;
            $estadoVerificacion = "incompleta";
            $todas_validas = false;
        } else {
            $verificacion = openssl_verify(
                $firma["hash_archivo"],
                base64_decode($firma["firma"]),
                $firma["clave_publica"],
                OPENSSL_ALGO_SHA256
            );

            $valida = $verificacion === 1;
            $estadoVerificacion = $valida ? "válida" : "inválida";

            if (!$valida) {
                $todas_validas = false;
            }
        }
    } else {
        $todas_validas = false;
    }

    $firmas[] = [
        "coordinador" => $firma["coordinador_nombre"],
        "email" => $firma["coordinador_email"],
        "estado" => $firma["estado"],
        "folio_firma" => $firma["folio_firma"],
        "fecha_firma" => $firma["fecha_firma"],
        "verificacion" => $estadoVerificacion,
        "valida" => $valida
    ];
}

if (count($firmas) === 0) {
    echo json_encode([
        "success" => false,
        "mensaje" => "El documento no tiene firmas registradas",
        "firmas" => []
    ]);
    exit();
}

echo json_encode([
    "success" => true,
    "firma_valida" => $hay_firmas && $todas_validas,
    "mensaje" => ($hay_firmas && $todas_validas)
        ? "Todas las firmas son válidas"
        : "Hay firmas pendientes, incompletas o inválidas",
    "firmas" => $firmas
]);