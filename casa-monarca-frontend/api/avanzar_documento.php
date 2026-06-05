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
$comentario = $data["comentario"] ?? "";

if (!$documento_id || !$usuario_id) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Datos incompletos"]);
    exit();
}

/*
  Consultamos al usuario desde la BD.
  Así no dependemos del rol que venga del frontend.
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
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Usuario no encontrado"]);
    exit();
}

$usuario = $resultUsuario->fetch_assoc();
$rol = strtolower($usuario["rol"]);

/*
  Consultamos el documento.
*/
$stmt = $conexion->prepare("
    SELECT id, titulo, etapa, coordinador_id, creado_por
    FROM documentos
    WHERE id = ?
    LIMIT 1
");

$stmt->bind_param("i", $documento_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Documento no encontrado"]);
    exit();
}

$doc = $result->fetch_assoc();
$etapa_actual = $doc["etapa"];

if ($etapa_actual === "A") {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "El documento ya está en Inserción final"]);
    exit();
}

/*
  Validación por coordinador:

  admin:
    puede avanzar cualquier documento

  coordinador:
    solo documentos donde documentos.coordinador_id = su id

  operador:
    solo documentos de su coordinador_id

  consulta:
    no puede avanzar
*/

if ($rol === "consulta") {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Consulta solo puede subir documentos, no avanzar etapas"]);
    exit();
}

if ($rol === "coordinador") {
    if (intval($doc["coordinador_id"]) !== intval($usuario["id"])) {
        ob_clean();
        echo json_encode(["success" => false, "mensaje" => "Este documento no pertenece a tu coordinación"]);
        exit();
    }
}

if ($rol === "operador") {
    if (empty($usuario["coordinador_id"])) {
        ob_clean();
        echo json_encode(["success" => false, "mensaje" => "El operador no tiene coordinador asignado"]);
        exit();
    }

    if (intval($doc["coordinador_id"]) !== intval($usuario["coordinador_id"])) {
        ob_clean();
        echo json_encode(["success" => false, "mensaje" => "No tienes permiso para avanzar este documento"]);
        exit();
    }
}

$nueva_etapa = null;

/*
  Flujo VOCA:

  V = Ventanilla       consulta sube
  O = Operador         operador aprueba
  C = Coordinador      coordinador firma
  A = Admin            admin hace inserción final

  Avances:
  V -> O: operador o admin
  O -> C: coordinador o admin
  C -> A: admin
*/

if ($etapa_actual === "V") {
    if (!in_array($rol, ["operador", "admin"])) {
        ob_clean();
        echo json_encode(["success" => false, "mensaje" => "Solo Operador o Admin pueden aprobar desde Ventanilla"]);
        exit();
    }

    $nueva_etapa = "O";
}

if ($etapa_actual === "O") {
    ob_clean();
    echo json_encode([
        "success" => false,
        "mensaje" => "Para pasar de Operador a Coordinador, el coordinador debe firmar con su clave privada"
    ]);
    exit();
}
if ($etapa_actual === "C") {
    if ($rol !== "admin") {
        ob_clean();
        echo json_encode(["success" => false, "mensaje" => "Solo Admin puede hacer la Inserción final"]);
        exit();
    }

    $nueva_etapa = "A";
}

if (!$nueva_etapa) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "No se pudo determinar la siguiente etapa"]);
    exit();
}

$update = $conexion->prepare("
    UPDATE documentos
    SET etapa = ?
    WHERE id = ?
");

$update->bind_param("si", $nueva_etapa, $documento_id);

if (!$update->execute()) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "No se pudo avanzar el documento"]);
    exit();
}

$historial = $conexion->prepare("
    INSERT INTO documentos_historial
    (documento_id, etapa_anterior, etapa_nueva, usuario_id, comentario)
    VALUES (?, ?, ?, ?, ?)
");

$historial->bind_param(
    "issis",
    $documento_id,
    $etapa_actual,
    $nueva_etapa,
    $usuario_id,
    $comentario
);

$historial->execute();

ob_clean();

echo json_encode([
    "success" => true,
    "mensaje" => "Documento avanzado correctamente",
    "etapa_anterior" => $etapa_actual,
    "etapa_nueva" => $nueva_etapa
]);

exit();