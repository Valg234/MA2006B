<?php
ob_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

ini_set("display_errors", 0);
error_reporting(E_ALL);

include("../conexion.php");

$method = $_SERVER["REQUEST_METHOD"];

try {
    if ($method === "GET") {
        $id = $_GET["id"] ?? null;

        if (!$id) {
            ob_clean();
            echo json_encode([
                "success" => false,
                "mensaje" => "ID requerido"
            ]);
            exit();
        }

        $stmt = $conexion->prepare("
            SELECT 
                id,
                nombre,
                email,
                rol,
                estado,
                fecha_vigencia,
                certificado_codigo,
                clave_coordinador,
                coordinador_id
            FROM usuarios
            WHERE id = ?
            LIMIT 1
        ");

        if (!$stmt) {
            throw new Exception($conexion->error);
        }

        $stmt->bind_param("i", $id);
        $stmt->execute();

        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            ob_clean();
            echo json_encode([
                "success" => false,
                "mensaje" => "Usuario no encontrado"
            ]);
            exit();
        }

        $usuario = $result->fetch_assoc();

        ob_clean();
        echo json_encode([
            "success" => true,
            "usuario" => $usuario
        ]);
        exit();
    }

    if ($method === "POST") {
        $data = json_decode(file_get_contents("php://input"), true);

        $id = $data["id"] ?? null;
        $nombre = trim($data["nombre"] ?? "");
        $email = trim($data["email"] ?? "");
        $rol = $data["rol"] ?? "";
        $estado = $data["estado"] ?? "activo";
        $fecha_vigencia = $data["fecha_vigencia"] ?? "";
        $coordinador_id = $data["coordinador_id"] ?? null;

        if (!$id || $nombre === "" || $email === "" || $rol === "" || $fecha_vigencia === "") {
            ob_clean();
            echo json_encode([
                "success" => false,
                "mensaje" => "Datos incompletos"
            ]);
            exit();
        }

        if ($rol === "admin" || $rol === "coordinador") {
            $coordinador_id = null;
        }

        if (($rol === "consulta" || $rol === "operador") && empty($coordinador_id)) {
            ob_clean();
            echo json_encode([
                "success" => false,
                "mensaje" => "Consulta y operador deben tener coordinador asignado"
            ]);
            exit();
        }

        $clave_coordinador = null;

        if ($rol === "coordinador") {
            $stmtClave = $conexion->prepare("
                SELECT clave_coordinador 
                FROM usuarios 
                WHERE id = ?
                LIMIT 1
            ");

            $stmtClave->bind_param("i", $id);
            $stmtClave->execute();
            $resClave = $stmtClave->get_result();
            $rowClave = $resClave->fetch_assoc();

            $clave_coordinador = $rowClave["clave_coordinador"] ?? null;

            if (empty($clave_coordinador)) {
                $clave_coordinador = strtoupper(substr(md5(uniqid("coord", true)), 0, 8));
            }
        }

        $stmt = $conexion->prepare("
            UPDATE usuarios
            SET 
                nombre = ?,
                email = ?,
                rol = ?,
                estado = ?,
                fecha_vigencia = ?,
                clave_coordinador = ?,
                coordinador_id = ?
            WHERE id = ?
        ");

        if (!$stmt) {
            throw new Exception($conexion->error);
        }

        $stmt->bind_param(
            "ssssssii",
            $nombre,
            $email,
            $rol,
            $estado,
            $fecha_vigencia,
            $clave_coordinador,
            $coordinador_id,
            $id
        );

        if ($stmt->execute()) {
            ob_clean();
            echo json_encode([
                "success" => true,
                "mensaje" => "Usuario actualizado correctamente"
            ]);
            exit();
        }

        throw new Exception($stmt->error);
    }

} catch (Exception $e) {
    ob_clean();
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "mensaje" => "Error en editar_usuario.php",
        "error" => $e->getMessage()
    ]);
    exit();
}

