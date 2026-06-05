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

$titulo = trim($_POST["titulo"] ?? "");
$descripcion = trim($_POST["descripcion"] ?? "");
$creado_por = $_POST["creado_por"] ?? null;

if ($titulo === "" || !$creado_por) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Datos incompletos"]);
    exit();
}

/*
  Buscar usuario real desde BD.
  No confiamos solo en el frontend.
*/
$stmtUsuario = $conexion->prepare("
    SELECT id, nombre, email, rol, coordinador_id, clave_publica
    FROM usuarios
    WHERE id = ?
    LIMIT 1
");

$stmtUsuario->bind_param("i", $creado_por);
$stmtUsuario->execute();
$resultUsuario = $stmtUsuario->get_result();

if ($resultUsuario->num_rows === 0) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Usuario no encontrado"]);
    exit();
}

$usuario = $resultUsuario->fetch_assoc();
$rol = strtolower($usuario["rol"]);

$rolesPermitidos = ["admin", "coordinador", "operador", "consulta"];

if (!in_array($rol, $rolesPermitidos)) {
    ob_clean();
    echo json_encode(["success" => false, "mensaje" => "Rol no autorizado"]);
    exit();
}

/*
  Asignación de coordinador:

  admin:
    puede mandar coordinador_id desde el frontend.
    si no manda, queda NULL.

  coordinador:
    el documento queda asignado a sí mismo.

  operador / consulta:
    el documento queda asignado al coordinador_id del usuario.
*/
$coordinador_id = null;

if ($rol === "admin") {
    $coordinador_id = !empty($_POST["coordinador_id"]) ? intval($_POST["coordinador_id"]) : null;
} else if ($rol === "coordinador") {
    $coordinador_id = intval($usuario["id"]);
} else if ($rol === "operador" || $rol === "consulta") {
    if (empty($usuario["coordinador_id"])) {
        ob_clean();
        echo json_encode([
            "success" => false,
            "mensaje" => "Este usuario no tiene coordinador asignado"
        ]);
        exit();
    }

    $coordinador_id = intval($usuario["coordinador_id"]);
}

/*
  Archivo
*/
$archivo_nombre = null;
$archivo_ruta = null;

if (isset($_FILES["archivo"]) && $_FILES["archivo"]["error"] === UPLOAD_ERR_OK) {
    $nombreOriginal = basename($_FILES["archivo"]["name"]);
    $extension = strtolower(pathinfo($nombreOriginal, PATHINFO_EXTENSION));

    $permitidas = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "xlsx"];

    if (!in_array($extension, $permitidas)) {
        ob_clean();
        echo json_encode([
            "success" => false,
            "mensaje" => "Tipo de archivo no permitido"
        ]);
        exit();
    }

    $carpeta = "../uploads/documentos/";

    if (!is_dir($carpeta)) {
        mkdir($carpeta, 0777, true);
    }

    $nombreFinal = uniqid("doc_", true) . "." . $extension;
    $rutaDestino = $carpeta . $nombreFinal;

    if (!move_uploaded_file($_FILES["archivo"]["tmp_name"], $rutaDestino)) {
        ob_clean();
        echo json_encode([
            "success" => false,
            "mensaje" => "No se pudo guardar el archivo"
        ]);
        exit();
    }

    $archivo_nombre = $nombreOriginal;
    $archivo_ruta = "uploads/documentos/" . $nombreFinal;
}

/*
  Crear documento en etapa V.
  V = Ventanilla
*/
$stmt = $conexion->prepare("
    INSERT INTO documentos
    (titulo, descripcion, archivo_nombre, archivo_ruta, etapa, coordinador_id, creado_por)
    VALUES (?, ?, ?, ?, 'V', ?, ?)
");

$stmt->bind_param(
    "ssssii",
    $titulo,
    $descripcion,
    $archivo_nombre,
    $archivo_ruta,
    $coordinador_id,
    $creado_por
);

if (!$stmt->execute()) {
    ob_clean();
    echo json_encode([
        "success" => false,
        "mensaje" => "Error creando documento",
        "error" => $conexion->error
    ]);
    exit();
}

$documento_id = $stmt->insert_id;

/*
  Guardar historial inicial.
*/
$historial = $conexion->prepare("
    INSERT INTO documentos_historial
    (documento_id, etapa_anterior, etapa_nueva, usuario_id, comentario)
    VALUES (?, NULL, 'V', ?, 'Documento creado en Ventanilla')
");

$historial->bind_param("ii", $documento_id, $creado_por);
$historial->execute();

ob_clean();

echo json_encode([
    "success" => true,
    "mensaje" => "Documento creado correctamente",
    "documento_id" => $documento_id
]);

exit();