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
$motivo = trim($data["motivo"] ?? "");

if (!$documento_id || !$usuario_id || $motivo === "") {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Datos incompletos"]);
    exit();
}

/* Buscar usuario */
$stmtUsuario = $conexion->prepare("
    SELECT id, nombre, rol, coordinador_id
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
$rol = strtolower($usuario["rol"]);

/* Buscar documento */
$stmtDoc = $conexion->prepare("
    SELECT id, titulo, etapa, coordinador_id, estado_documento
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

if ($doc["estado_documento"] === "rechazado") {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "El documento ya fue rechazado"]);
    exit();
}

if ($doc["etapa"] === "A") {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "No se puede rechazar un documento finalizado"]);
    exit();
}

/*
  Permisos de rechazo:
  - operador: solo en V y solo documentos de su coordinador.
  - coordinador: en O o C y solo documentos de su coordinación o firmas pendientes.
  - admin: cualquier etapa no finalizada.
*/

$puedeRechazar = false;

if ($rol === "admin") {
    $puedeRechazar = true;
}

if ($rol === "operador") {
    if ($doc["etapa"] === "V" && intval($doc["coordinador_id"]) === intval($usuario["coordinador_id"])) {
        $puedeRechazar = true;
    }
}

if ($rol === "coordinador") {
    if (in_array($doc["etapa"], ["O", "C"])) {
        if (intval($doc["coordinador_id"]) === intval($usuario_id)) {
            $puedeRechazar = true;
        } else {
            /* Si es coordinador adicional, también puede rechazar si tiene firma pendiente */
            $stmtFirma = $conexion->prepare("
                SELECT id
                FROM documentos_firmas
                WHERE documento_id = ?
                  AND coordinador_id = ?
                  AND estado = 'pendiente'
                LIMIT 1
            ");

            $stmtFirma->bind_param("ii", $documento_id, $usuario_id);
            $stmtFirma->execute();
            $resFirma = $stmtFirma->get_result();

            if ($resFirma->num_rows > 0) {
                $puedeRechazar = true;
            }
        }
    }
}

if (!$puedeRechazar) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "No tienes permiso para rechazar este documento"]);
    exit();
}

/* Rechazar */
$stmtUpdate = $conexion->prepare("
    UPDATE documentos
    SET estado_documento = 'rechazado',
        motivo_rechazo = ?,
        rechazado_por = ?,
        fecha_rechazo = NOW()
    WHERE id = ?
");

$stmtUpdate->bind_param("sii", $motivo, $usuario_id, $documento_id);

if (!$stmtUpdate->execute()) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "No se pudo rechazar el documento"]);
    exit();
}

/* Historial */
$comentario = "Documento rechazado. Motivo: " . $motivo;

$stmtHist = $conexion->prepare("
    INSERT INTO documentos_historial
    (documento_id, etapa_anterior, etapa_nueva, usuario_id, comentario)
    VALUES (?, ?, ?, ?, ?)
");

$etapa_actual = $doc["etapa"];
$etapa_nueva = $doc["etapa"];

$stmtHist->bind_param("issis", $documento_id, $etapa_actual, $etapa_nueva, $usuario_id, $comentario);
$stmtHist->execute();

ob_clean();

echo json_encode([
    "success" => true,
    "mensaje" => "Documento rechazado correctamente"
]);

exit();