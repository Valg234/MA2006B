<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

include("../conexion.php");

$usuario_id = $_GET["usuario_id"] ?? null;

if (!$usuario_id) {
    echo json_encode(["success" => false, "mensaje" => "Datos incompletos"]);
    exit();
}

/*
  Buscamos al usuario real desde BD.
*/
$stmtUsuario = $conexion->prepare("
    SELECT id, nombre, email, rol, coordinador_id, clave_publica
    FROM usuarios
    WHERE id = ?
    LIMIT 1
");

$stmtUsuario->bind_param("i", $usuario_id);
$stmtUsuario->execute();
$resultUsuario = $stmtUsuario->get_result();

if ($resultUsuario->num_rows === 0) {
    echo json_encode(["success" => false, "mensaje" => "Usuario no encontrado"]);
    exit();
}

$usuario = $resultUsuario->fetch_assoc();
$rol = strtolower($usuario["rol"]);

/*
  Reglas de visualización:

  admin:
    ve todos los documentos

  coordinador:
    ve documentos donde él es coordinador principal
    o documentos donde fue agregado como firma adicional

  operador / consulta:
    ven documentos del coordinador al que pertenecen
*/

if ($rol === "admin") {
    $stmt = $conexion->prepare("
        SELECT
            d.*,
            uc.nombre AS coordinador_nombre,
            uc.email AS coordinador_email,
            creador.nombre AS creado_por_nombre,
            creador.email AS creado_por_email,
            firmante.nombre AS firmado_por_nombre,
            firmante.email AS firmado_por_email
        FROM documentos d
        LEFT JOIN usuarios uc ON d.coordinador_id = uc.id
        LEFT JOIN usuarios creador ON d.creado_por = creador.id
        LEFT JOIN usuarios firmante ON d.firmado_por = firmante.id
        ORDER BY d.fecha_creacion DESC
    ");
} else if ($rol === "coordinador") {
    $stmt = $conexion->prepare("
        SELECT
            d.*,
            uc.nombre AS coordinador_nombre,
            uc.email AS coordinador_email,
            creador.nombre AS creado_por_nombre,
            creador.email AS creado_por_email,
            firmante.nombre AS firmado_por_nombre,
            firmante.email AS firmado_por_email
        FROM documentos d
        LEFT JOIN usuarios uc ON d.coordinador_id = uc.id
        LEFT JOIN usuarios creador ON d.creado_por = creador.id
        LEFT JOIN usuarios firmante ON d.firmado_por = firmante.id
        WHERE d.coordinador_id = ?
           OR EXISTS (
                SELECT 1
                FROM documentos_firmas df
                WHERE df.documento_id = d.id
                  AND df.coordinador_id = ?
           )
        ORDER BY d.fecha_creacion DESC
    ");

    $stmt->bind_param("ii", $usuario["id"], $usuario["id"]);
} else if ($rol === "operador" || $rol === "consulta") {
    if (empty($usuario["coordinador_id"])) {
        echo json_encode([
            "success" => true,
            "documentos" => [],
            "mensaje" => "El usuario no tiene coordinador asignado"
        ]);
        exit();
    }

    $stmt = $conexion->prepare("
        SELECT
            d.*,
            uc.nombre AS coordinador_nombre,
            uc.email AS coordinador_email,
            creador.nombre AS creado_por_nombre,
            creador.email AS creado_por_email,
            firmante.nombre AS firmado_por_nombre,
            firmante.email AS firmado_por_email
        FROM documentos d
        LEFT JOIN usuarios uc ON d.coordinador_id = uc.id
        LEFT JOIN usuarios creador ON d.creado_por = creador.id
        LEFT JOIN usuarios firmante ON d.firmado_por = firmante.id
        WHERE d.coordinador_id = ?
        ORDER BY d.fecha_creacion DESC
    ");

    $stmt->bind_param("i", $usuario["coordinador_id"]);
} else {
    echo json_encode(["success" => false, "mensaje" => "Rol no autorizado"]);
    exit();
}

if (!$stmt->execute()) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Error consultando documentos",
        "error" => $conexion->error
    ]);
    exit();
}

$result = $stmt->get_result();
$documentos = [];

while ($row = $result->fetch_assoc()) {
    $documento_id = $row["id"];

    $stmtFirmas = $conexion->prepare("
        SELECT
            df.id,
            df.coordinador_id,
            df.estado,
            df.hash_archivo,
            df.firma,
            df.folio_firma,
            df.accion_firma,
            df.fecha_solicitud,
            df.fecha_firma,
            u.nombre AS coordinador_nombre,
            u.email AS coordinador_email
        FROM documentos_firmas df
        LEFT JOIN usuarios u ON df.coordinador_id = u.id
        WHERE df.documento_id = ?
        ORDER BY df.fecha_solicitud ASC, df.id ASC
    ");

    $stmtFirmas->bind_param("i", $documento_id);
    $stmtFirmas->execute();
    $resFirmas = $stmtFirmas->get_result();

    $firmas = [];
    $firmas_pendientes = 0;
    $firmas_firmadas = 0;

    while ($firma = $resFirmas->fetch_assoc()) {
        if ($firma["estado"] === "pendiente") {
            $firmas_pendientes++;
        }

        if ($firma["estado"] === "firmado") {
            $firmas_firmadas++;
        }

        $firmas[] = $firma;
    }

    /*
      Compatibilidad con firmas anteriores guardadas directo en documentos.
      Si el documento tiene firma vieja, pero todavía no tiene registros en documentos_firmas,
      la mostramos para no perderla visualmente.
    */
    if (count($firmas) === 0 && !empty($row["firma_coordinador"])) {
        $firmas_firmadas = 1;

        $firmas[] = [
            "id" => null,
            "coordinador_id" => $row["firmado_por"],
            "estado" => "firmado",
            "hash_archivo" => $row["hash_archivo"],
            "firma" => $row["firma_coordinador"],
            "folio_firma" => $row["folio_firma"],
            "accion_firma" => $row["accion_firma"],
            "fecha_solicitud" => null,
            "fecha_firma" => $row["fecha_firma"],
            "coordinador_nombre" => $row["firmado_por_nombre"],
            "coordinador_email" => $row["firmado_por_email"]
        ];
    }

    $row["firmas"] = $firmas;
    $row["firmas_pendientes"] = $firmas_pendientes;
    $row["firmas_firmadas"] = $firmas_firmadas;

    $documentos[] = $row;
}

echo json_encode([
    "success" => true,
    "usuario" => $usuario,
    "documentos" => $documentos
]);