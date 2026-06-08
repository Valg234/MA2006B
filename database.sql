-- ============================================================
-- Casa Monarca - Schema completo
-- Ejecutar en phpMyAdmin (pestaña SQL) o desde terminal:
--   mysql -u root < database.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS casa_monarca;
USE casa_monarca;

-- ------------------------------------------------------------
-- Tabla: usuarios
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    estado VARCHAR(50) DEFAULT 'activo',
    fecha_vigencia DATE NULL,
    certificado_codigo VARCHAR(100) NULL,
    clave_coordinador VARCHAR(100) NULL,
    coordinador_id INT NULL,
    clave_publica TEXT NULL,
    clave_privada_cifrada TEXT NULL
);

-- ------------------------------------------------------------
-- Tabla: migrantes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS migrantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido_paterno VARCHAR(255) NULL,
    apellido_materno VARCHAR(255) NULL,
    fecha_nacimiento DATE NULL,
    edad INT NULL,
    sexo VARCHAR(50) DEFAULT 'no_especificado',
    nacionalidad VARCHAR(100) NULL,
    telefono VARCHAR(50) NULL,
    email VARCHAR(255) NULL,
    pais_origen VARCHAR(100) NULL,
    estado_origen VARCHAR(100) NULL,
    ciudad_origen VARCHAR(100) NULL,
    pais_destino VARCHAR(100) NULL,
    estado_destino VARCHAR(100) NULL,
    ciudad_destino VARCHAR(100) NULL,
    estatus_migratorio VARCHAR(100) NULL,
    motivo_atencion TEXT NULL,
    observaciones TEXT NULL,
    creado_por INT NULL,
    solicitud_id INT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Tabla: documentos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NULL,
    archivo_nombre VARCHAR(255) NULL,
    archivo_ruta VARCHAR(500) NULL,
    etapa VARCHAR(10) DEFAULT 'V',
    coordinador_id INT NULL,
    creado_por INT NULL,
    hash_archivo VARCHAR(64) NULL,
    estado_documento VARCHAR(50) DEFAULT 'activo',
    firma_coordinador TEXT NULL,
    folio_firma VARCHAR(100) NULL,
    accion_firma VARCHAR(255) NULL,
    firmado_por INT NULL,
    fecha_firma DATETIME NULL
);

-- ------------------------------------------------------------
-- Tabla: documentos_historial
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documentos_historial (
    id INT AUTO_INCREMENT PRIMARY KEY,
    documento_id INT NOT NULL,
    etapa_anterior VARCHAR(10) NULL,
    etapa_nueva VARCHAR(10) NULL,
    usuario_id INT NULL,
    comentario TEXT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Tabla: documentos_firmas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documentos_firmas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    documento_id INT NOT NULL,
    coordinador_id INT NOT NULL,
    solicitado_por INT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    hash_archivo VARCHAR(64) NULL,
    firma TEXT NULL,
    folio_firma VARCHAR(100) NULL,
    accion_firma VARCHAR(255) NULL,
    fecha_firma DATETIME NULL,
    UNIQUE KEY unique_doc_coord (documento_id, coordinador_id)
);

-- ------------------------------------------------------------
-- Tabla: solicitudes_push
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS solicitudes_push (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    coordinador_id INT NOT NULL,
    tipo_solicitud VARCHAR(100) NOT NULL,
    datos_json TEXT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Usuario admin de prueba
-- Email: admin@demo.com
-- Password: casa_monarca_pass
-- ------------------------------------------------------------
INSERT INTO usuarios (nombre, email, password, rol, estado, fecha_vigencia)
VALUES (
    'Administrador',
    'admin@demo.com',
    '$2y$10$7YzaEJ7FapwzGrJFpXgh4uBFpzkPYoqY.l3ubudQC86jrDdN86.Wa',
    'admin',
    'activo',
    '2027-12-31'
);
