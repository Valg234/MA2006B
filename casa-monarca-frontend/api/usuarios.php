<?php
ob_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

include("../conexion.php");

try {

    $usuario_id = $_GET["usuario_id"] ?? null;
    $rol = $_GET["rol"] ?? "";

    if ($usuario_id && $rol === "coordinador") {
        $stmt = $conexion->prepare("
            SELECT 
                u.id,
                u.nombre,
                u.email,
                u.rol,
                u.estado,
                u.fecha_vigencia,
                u.certificado_codigo,
                u.clave_coordinador,
                u.coordinador_id,
                c.nombre AS coordinador_nombre
            FROM usuarios u
            LEFT JOIN usuarios c ON u.coordinador_id = c.id
            WHERE u.id = ?
               OR u.coordinador_id = ?
            ORDER BY u.id DESC
        ");

        $stmt->bind_param("ii", $usuario_id, $usuario_id);

    } else {

        $stmt = $conexion->prepare("
            SELECT 
                u.id,
                u.nombre,
                u.email,
                u.rol,
                u.estado,
                u.fecha_vigencia,
                u.certificado_codigo,
                u.clave_coordinador,
                u.coordinador_id,
                c.nombre AS coordinador_nombre
            FROM usuarios u
            LEFT JOIN usuarios c ON u.coordinador_id = c.id
            ORDER BY u.id DESC
        ");
    }

    if (!$stmt) {
        throw new Exception($conexion->error);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    $usuarios = [];

    while ($row = $result->fetch_assoc()) {
        $usuarios[] = $row;
    }

    ob_clean();
    echo json_encode($usuarios);
    exit();

} catch (Exception $e) {
    ob_clean();
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "mensaje" => "Error en usuarios.php",
        "error" => $e->getMessage()
    ]);
}

