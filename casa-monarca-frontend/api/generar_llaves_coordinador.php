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

$solicitante_id = $data["solicitante_id"] ?? null;
$coordinador_id = $data["coordinador_id"] ?? null;
$password_firma = $data["password_firma"] ?? "";

if (!$solicitante_id || !$coordinador_id || trim($password_firma) === "") {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Datos incompletos"]);
    exit();
}

if (strlen($password_firma) < 6) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "La contraseña de firma debe tener mínimo 6 caracteres"]);
    exit();
}

/* Revisar quién solicita */
$stmtSol = $conexion->prepare("
    SELECT id, rol
    FROM usuarios
    WHERE id = ?
    LIMIT 1
");
$stmtSol->bind_param("i", $solicitante_id);
$stmtSol->execute();
$resSol = $stmtSol->get_result();

if ($resSol->num_rows === 0) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Usuario solicitante no encontrado"]);
    exit();
}

$solicitante = $resSol->fetch_assoc();
$rol_solicitante = strtolower($solicitante["rol"]);

/* Revisar que el usuario destino sea coordinador */
$stmtCoord = $conexion->prepare("
    SELECT id, nombre, email, rol
    FROM usuarios
    WHERE id = ?
    LIMIT 1
");
$stmtCoord->bind_param("i", $coordinador_id);
$stmtCoord->execute();
$resCoord = $stmtCoord->get_result();

if ($resCoord->num_rows === 0) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Coordinador no encontrado"]);
    exit();
}

$coordinador = $resCoord->fetch_assoc();

if (strtolower($coordinador["rol"]) !== "coordinador") {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "El usuario seleccionado no es coordinador"]);
    exit();
}

/*
  Permisos:
  - admin puede generar llaves para cualquier coordinador
  - coordinador solo puede generar sus propias llaves
*/
if ($rol_solicitante !== "admin" && intval($solicitante_id) !== intval($coordinador_id)) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "No tienes permiso para generar estas llaves"]);
    exit();
}

/* Generar par de llaves RSA */
$config = [
    "private_key_bits" => 2048,
    "private_key_type" => OPENSSL_KEYTYPE_RSA,
    "config" => "C:/MAMP/bin/apache/conf/openssl.cnf"
];

$parLlaves = openssl_pkey_new($config);

if (!$parLlaves) {
    $errores = [];

    while ($msg = openssl_error_string()) {
        $errores[] = $msg;
    }

    ob_clean();
    echo json_encode([
        "success" => false,
        "mensaje" => "No se pudieron generar las llaves",
        "errores" => $errores
    ]);
    exit();
}
/* Exportar clave privada cifrada con contraseña */
$ok = openssl_pkey_export(
    $parLlaves,
    $clavePrivadaCifrada,
    $password_firma,
    $config
);

if (!$ok) {
    $errores = [];

    while ($msg = openssl_error_string()) {
        $errores[] = $msg;
    }

    ob_clean();
    echo json_encode([
        "success" => false,
        "mensaje" => "No se pudo cifrar la clave privada",
        "errores" => $errores
    ]);
    exit();
}

/* Obtener clave pública */
$detalles = openssl_pkey_get_details($parLlaves);
$clavePublica = $detalles["key"];

/* Guardar en base */
$stmtUpdate = $conexion->prepare("
    UPDATE usuarios
    SET clave_publica = ?, clave_privada_cifrada = ?
    WHERE id = ?
");

$stmtUpdate->bind_param("ssi", $clavePublica, $clavePrivadaCifrada, $coordinador_id);

if (!$stmtUpdate->execute()) {
    ob_clean();
    echo json_encode([
        "success" => false,
        "mensaje" => "No se pudieron guardar las llaves",
        "error" => $conexion->error
    ]);
    exit();
}

ob_clean();

echo json_encode([
    "success" => true,
    "mensaje" => "Llaves generadas correctamente para el coordinador",
    "coordinador" => [
        "id" => $coordinador["id"],
        "nombre" => $coordinador["nombre"],
        "email" => $coordinador["email"]
    ]
]);

exit();