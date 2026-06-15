# TODO — Gestor de Identidades y Documentos

Lista de tareas pendientes para las siguientes versiones del sistema.
Las marcadas con ⚠️ son prioritarias antes de cualquier despliegue en producción.

---

## Pruebas y validación

- [ ] Extender el plan de pruebas funcionales al módulo de firma digital de documentos
- [ ] Extender el plan de pruebas funcionales al módulo de migrantes
- [ ] Extender el plan de pruebas funcionales al módulo de solicitudes push
- [ ] Completar las imágenes de evidencia faltantes en los casos de prueba 4 y 15
- [ ] Realizar pruebas de aceptación con el equipo de Casa Monarca en su entorno real

---

## Correcciones antes de producción

- [ ] ⚠️ Externalizar las credenciales de conexión a la base de datos (actualmente están escritas en el código fuente); usar variables de entorno del servidor
- [ ] ⚠️ Estandarizar y restringir la política de comunicación entre la interfaz y el servidor en todos los módulos
- [ ] ⚠️ Establecer una política de complejidad mínima para la contraseña de firma de los coordinadores
- [ ] Completar la documentación de los endpoints del servidor con descripción de parámetros y respuestas

---

## Nuevas funcionalidades

- [ ] Alertas automáticas al administrador cuando la vigencia de un usuario esté próxima a vencer
- [ ] Panel de auditoría que muestre el historial completo de cambios de etapa y firmas por documento
- [ ] Reportes de actividad descargables: usuarios activos por perfil, documentos por etapa, tiempos promedio de aprobación
- [ ] Botón de generación de llaves de firma directamente desde el panel de administración (actualmente se realiza por proceso separado)
- [ ] Notificación interna al coordinador cuando un documento está pendiente de su firma

---

## Escalabilidad e infraestructura

- [ ] Empaquetar la aplicación para que su instalación en un servidor nuevo sea automatizada y reproducible (por ejemplo, con un script de configuración o contenedor)
- [ ] Evaluar la migración a un esquema de sesión segura del lado del servidor para ambientes con múltiples usuarios concurrentes
- [ ] Agregar paginación a las listas de documentos y migrantes para soportar volúmenes grandes de registros
- [ ] Evaluar respaldo automático periódico de la base de datos

---

## Documentación

- [ ] Documentar el proceso de instalación en un entorno de producción (distinto al entorno de desarrollo local)
- [ ] Agregar guía de recuperación de acceso para el administrador principal
