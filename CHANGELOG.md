# Changelog — Gestor de Identidades y Documentos

Todos los cambios relevantes de este proyecto están documentados en este archivo.
El formato sigue el estándar [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [1.0.0] — 2026-06-14

Versión de entrega final del reto MA2006B. Sistema funcional y validado.

### Añadido
- Módulo de autenticación con cifrado seguro de contraseñas y validación de estado de cuenta (activa, inactiva, revocada)
- Control de vigencia por usuario: acceso bloqueado automáticamente al vencer la fecha límite
- Código de identidad digital único generado al registrar cada usuario
- Panel de administración con alta, edición y desactivación de usuarios, asignación de rol y fecha de vigencia
- Cuatro roles con permisos diferenciados: Administrador, Coordinador, Operador y Consulta
- Flujo documental de cuatro etapas (Ventanilla → Operador → Coordinador → Inserción Final)
- Firma digital de documentos con clave personal del coordinador
- Verificación de autenticidad de firmas con folio único y registro de quién firmó y cuándo
- Módulo de registro y consulta de expedientes de migrantes
- Módulo de solicitudes push para comunicación interna entre el equipo
- 15 casos de prueba funcionales documentados con resultado satisfactorio
- Documentación técnica completa: reporte técnico, reporte ejecutivo, manual de usuario y manual de desarrollo

---

## [0.4.0] — 2026-06-04

Cierre del módulo de firmas digitales y preparación de la demostración final.

### Añadido
- Tickets de firma con folio único por documento firmado
- Control de firmado por departamento y jerarquía de coordinadores
- Escalabilidad del flujo de firmas para múltiples coordinadores
- Vinculación del sistema con el ODS 16 (Paz, Justicia e Instituciones Sólidas)

### Modificado
- Refinamiento del proceso criptográfico de firmado para mayor trazabilidad

---

## [0.3.0] — 2026-05-29

Implementación del gestor documental y validación del flujo de firmas.

### Añadido
- Flujo V-O-C-A completo: Ventanilla, Operador, Coordinador, Inserción Final
- Gestor de documentos con avance por etapas desde la interfaz
- Validación de firmas digitales dentro del sistema
- Aclaración y documentación del proceso criptográfico de firmado

---

## [0.2.0] — 2026-04-24

Consolidación del módulo de identidades y control de acceso.

### Añadido
- Definición y aplicación de jerarquías de coordinadores
- Permisos diferenciados por rol en rutas de la interfaz y en cada función del servidor
- Manejo de contingencia para cuentas de administrador
- Pruebas de validación de roles y permisos

### Modificado
- Ajustes de interfaz tras la demostración del 14 de abril
- Revisión de estructura de roles y alcance de permisos

---

## [0.1.0] — 2026-04-10

Configuración inicial del proyecto y primeras funcionalidades de identidad.

### Añadido
- Análisis de requerimientos y arquitectura del sistema
- Migración e integración de datos del sistema previo de Casa Monarca
- Definición de credenciales de acceso y flujo de verificación
- Certificados digitales únicos por usuario
- Base de datos con tablas de usuarios, documentos, firmas, historial y migrantes
- Configuración del entorno de desarrollo (Apache, MySQL, React, Vite)
