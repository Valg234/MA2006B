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

$nombre = trim($data["nombre"] ?? "");
$email = trim($data["email"] ?? "");
$password = $data["password"] ?? "";
$rol = $data["rol"] ?? "";
$estado = $data["estado"] ?? "activo";
$fecha_vigencia = $data["fecha_vigencia"] ?? "";
$coordinador_id = $data["coordinador_id"] ?? null;

$roles_validos = ["admin", "coordinador", "consulta", "operador"];
$estados_validos = ["activo", "inactivo", "revocado"];

if (
    $nombre === "" ||
    $email === "" ||
    $password === "" ||
    $rol === "" ||
    $fecha_vigencia === ""
) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Datos incompletos"
    ]);
    exit();
}

if (!in_array($rol, $roles_validos)) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Rol inválido"
    ]);
    exit();
}

if (!in_array($estado, $estados_validos)) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Estado inválido"
    ]);
    exit();
}

if (($rol === "consulta" || $rol === "operador") && empty($coordinador_id)) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Debes asignar un coordinador para usuarios de consulta o operador"
    ]);
    exit();
}

if ($rol === "admin" || $rol === "coordinador") {
    $coordinador_id = null;
}

$stmt = $conexion->prepare("SELECT id FROM usuarios WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Ya existe un usuario con ese correo"
    ]);
    exit();
}

$password_hash = password_hash($password, PASSWORD_DEFAULT);

$certificado_codigo = strtoupper(substr(md5(uniqid($email, true)), 0, 12));

$clave_coordinador = null;

if ($rol === "coordinador") {
    $clave_coordinador = strtoupper(substr(md5(uniqid("coord", true)), 0, 8));
}

$stmt = $conexion->prepare("
    INSERT INTO usuarios (
        nombre,
        email,
        password,
        rol,
        estado,
        fecha_vigencia,
        certificado_codigo,
        clave_coordinador,
        coordinador_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
");

$stmt->bind_param(
    "ssssssssi",
    $nombre,
    $email,
    $password_hash,
    $rol,
    $estado,
    $fecha_vigencia,
    $certificado_codigo,
    $clave_coordinador,
    $coordinador_id
);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "mensaje" => "Usuario creado correctamente",
        "certificado_codigo" => $certificado_codigo,
        "clave_coordinador" => $clave_coordinador
    ]);
} else {
    echo json_encode([
        "success" => false,
        "mensaje" => "Error al crear usuario",
        "error" => $stmt->error
    ]);
}

