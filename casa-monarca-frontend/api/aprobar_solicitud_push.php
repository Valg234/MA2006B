<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

include("../conexion.php");

$data = json_decode(file_get_contents("php://input"), true);

$id = $data["id"] ?? null;
$usuario_id = $data["usuario_id"] ?? null;
$rol = $data["rol"] ?? "";

if (!$id || !$usuario_id || !in_array($rol, ["admin", "coordinador"])) {
    echo json_encode(["success" => false, "mensaje" => "No autorizado"]);
    exit();
}

$stmt = $conexion->prepare("SELECT * FROM solicitudes_push WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "mensaje" => "Solicitud no encontrada"]);
    exit();
}

$solicitud = $result->fetch_assoc();

if ($rol === "coordinador" && intval($solicitud["coordinador_id"]) !== intval($usuario_id)) {
    echo json_encode(["success" => false, "mensaje" => "No puedes aprobar esta solicitud"]);
    exit();
}

if ($solicitud["estado"] !== "pendiente") {
    echo json_encode(["success" => false, "mensaje" => "Solicitud ya procesada"]);
    exit();
}

$datos = json_decode($solicitud["datos_json"], true);

if ($solicitud["tipo_solicitud"] === "crear_migrante") {
    $nombre = $datos["nombre"] ?? "";
    $apellido_paterno = $datos["apellido_paterno"] ?? null;
    $apellido_materno = $datos["apellido_materno"] ?? null;
    $fecha_nacimiento = $datos["fecha_nacimiento"] ?? null;
    $edad = $datos["edad"] !== "" ? intval($datos["edad"]) : null;
    $sexo = $datos["sexo"] ?? "no_especificado";
    $nacionalidad = $datos["nacionalidad"] ?? null;
    $telefono = $datos["telefono"] ?? null;
    $email = $datos["email"] ?? null;
    $pais_origen = $datos["pais_origen"] ?? null;
    $estado_origen = $datos["estado_origen"] ?? null;
    $ciudad_origen = $datos["ciudad_origen"] ?? null;
    $pais_destino = $datos["pais_destino"] ?? null;
    $estado_destino = $datos["estado_destino"] ?? null;
    $ciudad_destino = $datos["ciudad_destino"] ?? null;
    $estatus_migratorio = $datos["estatus_migratorio"] ?? null;
    $motivo_atencion = $datos["motivo_atencion"] ?? null;
    $observaciones = $datos["observaciones"] ?? null;
    $creado_por = intval($solicitud["usuario_id"]);
    $solicitud_id = intval($id);

    $stmt = $conexion->prepare("
        INSERT INTO migrantes (
            nombre, apellido_paterno, apellido_materno, fecha_nacimiento, edad,
            sexo, nacionalidad, telefono, email,
            pais_origen, estado_origen, ciudad_origen,
            pais_destino, estado_destino, ciudad_destino,
            estatus_migratorio, motivo_atencion, observaciones,
            creado_por, solicitud_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->bind_param(
        "ssssisssssssssssssii",
        $nombre,
        $apellido_paterno,
        $apellido_materno,
        $fecha_nacimiento,
        $edad,
        $sexo,
        $nacionalidad,
        $telefono,
        $email,
        $pais_origen,
        $estado_origen,
        $ciudad_origen,
        $pais_destino,
        $estado_destino,
        $ciudad_destino,
        $estatus_migratorio,
        $motivo_atencion,
        $observaciones,
        $creado_por,
        $solicitud_id
    );

    if (!$stmt->execute()) {
        echo json_encode(["success" => false, "mensaje" => "Error insertando migrante", "error" => $stmt->error]);
        exit();
    }
}

$stmt = $conexion->prepare("
    UPDATE solicitudes_push
    SET estado = 'aprobada', revisado_en = NOW()
    WHERE id = ?
");

$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "mensaje" => "Solicitud aprobada e insertada"]);
} else {
    echo json_encode(["success" => false, "mensaje" => "Error al aprobar"]);
}

