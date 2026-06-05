<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

include("../conexion.php");

$data = json_decode(file_get_contents("php://input"), true);

$user_id = isset($data["user_id"]) ? (int)$data["user_id"] : 0;
$certificado_codigo = trim($data["certificado_codigo"] ?? "");
$clave = $data["clave"] ?? "";

if ($user_id <= 0 || $certificado_codigo === "" || $clave === "") {
    echo json_encode([
        "success" => false,
        "mensaje" => "Datos incompletos."
    ]);
    exit();
}

$sql = "SELECT id, nombre, email, rol, estado, fecha_vigencia, certificado_codigo, clave_coordinador
        FROM usuarios
        WHERE id = ?";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Error al preparar la consulta.",
        "debug" => $conn->error
    ]);
    $conn->close();
    exit();
}

$stmt->bind_param("i", $user_id);
$stmt->execute();
$resultado = $stmt->get_result();

if (!$usuario = $resultado->fetch_assoc()) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Usuario no encontrado."
    ]);
    $stmt->close();
    $conn->close();
    exit();
}

if ($usuario["rol"] !== "coordinador") {
    echo json_encode([
        "success" => false,
        "mensaje" => "El usuario no es coordinador."
    ]);
    $stmt->close();
    $conn->close();
    exit();
}

if ($usuario["estado"] !== "activo") {
    echo json_encode([
        "success" => false,
        "mensaje" => "Usuario no activo."
    ]);
    $stmt->close();
    $conn->close();
    exit();
}

if (!empty($usuario["fecha_vigencia"]) && $usuario["fecha_vigencia"] < date("Y-m-d")) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Usuario vencido."
    ]);
    $stmt->close();
    $conn->close();
    exit();
}

if ($usuario["certificado_codigo"] !== $certificado_codigo) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Certificado o key incorrectos."
    ]);
    $stmt->close();
    $conn->close();
    exit();
}

if (empty($usuario["clave_coordinador"]) || !password_verify($clave, $usuario["clave_coordinador"])) {
    echo json_encode([
        "success" => false,
        "mensaje" => "Certificado o key incorrectos."
    ]);
    $stmt->close();
    $conn->close();
    exit();
}

echo json_encode([
    "success" => true,
    "usuario" => [
        "id" => $usuario["id"],
        "nombre" => $usuario["nombre"],
        "email" => $usuario["email"],
        "rol" => $usuario["rol"],
        "estado" => $usuario["estado"],
        "fecha_vigencia" => $usuario["fecha_vigencia"],
        "certificado_codigo" => $usuario["certificado_codigo"],
        "coordinador_validado" => true
    ]
]);

$stmt->close();
$conn->close();
exit();
?>

