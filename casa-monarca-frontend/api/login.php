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

ini_set("display_errors", 0);
error_reporting(E_ALL);

include("../conexion.php");

$data = json_decode(file_get_contents("php://input"), true);

$email = trim($data["email"] ?? "");
$password = $data["password"] ?? "";

if ($email === "" || $password === "") {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Datos incompletos"]);
    exit();
}

$stmt = $conexion->prepare("
    SELECT 
        id, nombre, email, password, rol, estado, fecha_vigencia,
        certificado_codigo, clave_coordinador, coordinador_id
    FROM usuarios
    WHERE email = ?
    LIMIT 1
");

if (!$stmt) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Error preparando consulta", "error" => $conexion->error]);
    exit();
}

$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows === 0) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Usuario no encontrado"]);
    exit();
}

$usuario = $result->fetch_assoc();

if (!password_verify($password, $usuario["password"])) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Contraseña incorrecta"]);
    exit();
}

if ($usuario["estado"] !== "activo") {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Usuario inactivo o revocado"]);
    exit();
}

$hoy = date("Y-m-d");

if (!empty($usuario["fecha_vigencia"]) && $usuario["fecha_vigencia"] < $hoy) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "La vigencia del usuario ha expirado"]);
    exit();
}

unset($usuario["password"]);

ob_clean();

echo json_encode([
    "success" => true,
    "mensaje" => "Login correcto",
    "usuario" => $usuario
]);

exit();

