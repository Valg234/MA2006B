# Gestor de Identidades — Casa Monarca

Sistema web para la gestión de identidades digitales, firma de documentos institucionales y registro de expedientes de migrantes, desarrollado para [Casa Monarca, Ayuda Humanitaria al Migrante, A.B.P.](https://casamonarca.org.mx/) como parte del reto MA2006B del Tecnológico de Monterrey.

---

## Características principales

- **Autenticación segura** — contraseñas cifradas con BCRYPT; acceso bloqueado para cuentas inactivas, revocadas o con vigencia vencida.
- **Control de acceso por roles (RBAC)** — cuatro niveles: `admin`, `coordinador`, `operador` y `consulta`; rutas protegidas tanto en frontend como en cada endpoint del backend.
- **Certificados digitales únicos por usuario** — código generado automáticamente al crear cada cuenta; identidad digital verificable.
- **Control de vigencias** — cada cuenta tiene una fecha de expiración configurable; el sistema la valida en cada inicio de sesión.
- **Flujo documental VOCA** — cuatro etapas (Ventanilla → Operador → Coordinador → Inserción final) con transiciones controladas por rol.
- **Firma digital RSA-2048 + SHA-256** — los coordinadores firman documentos con su clave privada (protegida por contraseña); la firma es verificable por cualquier usuario.
- **Verificación criptográfica de integridad** — detecta si un documento fue modificado después de ser firmado.
- **Gestión de expedientes de migrantes** — registro y consulta de personas atendidas.
- **Solicitudes push internas** — módulo de avisos y peticiones entre el equipo.
- **SPA React con rutas protegidas** — interfaz de página única; redirige al login si la sesión no es válida.

---

## Requisitos previos

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| Node.js | v20.19 o v22.12+ | [nodejs.org](https://nodejs.org) |
| XAMPP (Apache + MySQL) | Cualquier versión reciente | [apachefriends.org](https://www.apachefriends.org) |
| Navegador moderno | Chrome, Firefox o Edge actualizados | — |

Para verificar que Node.js está instalado:

```bash
node --version
npm --version
```

---

## Instalación

### 1. Copiar el proyecto en XAMPP

Coloca la carpeta del proyecto dentro de `htdocs`:

```
C:\xampp\htdocs\casa-monarca-frontend\
```

Apache solo puede servir archivos PHP desde `htdocs`. Si el proyecto está en otra ubicación, los endpoints del backend no responderán.

### 2. Iniciar XAMPP

Abre el Panel de Control de XAMPP y enciende **Apache** y **MySQL** (deben aparecer en verde).

> **Puerto 3306 ocupado:** abre Administrador de tareas → Servicios → busca "MySQL" → Detener. Luego reinicia MySQL desde XAMPP.

### 3. Importar la base de datos

1. Abre `http://localhost/phpmyadmin` en el navegador.
2. Haz clic en **Nueva** (panel izquierdo) y crea una base de datos llamada `casa_monarca`.
3. Selecciona la base de datos recién creada.
4. Ve a la pestaña **Importar**, selecciona el archivo `database.sql` (raíz del proyecto) y haz clic en **Continuar**.

Esto crea las tablas necesarias y un usuario administrador inicial.

### 4. Configurar la conexión a MySQL

Abre `casa-monarca-frontend/conexion.php` y actualiza los datos de tu instalación:

```php
$host       = "localhost";
$usuario    = "root";         // usuario de MySQL
$password   = "";             // contraseña de MySQL (vacía en XAMPP por defecto)
$base_datos = "casa_monarca";
```

> No publiques credenciales reales. Cada instalación debe configurar su propio usuario y contraseña antes de desplegar en producción.

### 5. Instalar dependencias de Node

Abre una terminal en la carpeta `casa-monarca-frontend/` y ejecuta:

```bash
npm ci
```

Solo es necesario la primera vez (o cuando cambien las dependencias en `package.json`).

### 6. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Vite levanta el servidor en `http://localhost:5173`. Abre esa URL en el navegador.

---

## Configuración

### Proxy de desarrollo (Vite → Apache)

El archivo `vite.config.js` redirige automáticamente las peticiones a `/api/*` hacia Apache:

```js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost',
      changeOrigin: true,
      rewrite: (path) => path
    }
  }
}
```

No es necesario modificarlo salvo que Apache corra en un puerto distinto al 80.

### Variables de entorno

No se usa `.env`. La conexión a MySQL se configura directamente en `conexion.php`. Para producción, se recomienda mover las credenciales a variables de entorno del servidor y restringir los headers CORS en cada endpoint PHP.

---

## Uso básico

### Credenciales iniciales (usuario demo)

| Campo | Valor |
|---|---|
| Email | `admin@demo.com` |
| Contraseña | `casa_monarca_pass` |

> Cambia esta contraseña inmediatamente después del primer ingreso en producción.

### Flujo de ejemplo de punta a punta

1. Inicia sesión como **admin** → verifica que el dashboard cargue con tu nombre y rol.
2. Ve a **Administración** → crea un usuario con rol `operador` y otro con rol `coordinador`.
3. Para el coordinador, genera sus llaves RSA desde el panel de administración.
4. Inicia sesión como el usuario **consulta** (o admin) → ve al **Gestor de documentos** → sube un archivo de prueba.
5. Inicia sesión como **operador** → aprueba el documento desde Ventanilla.
6. Inicia sesión como **coordinador** → firma el documento con tu contraseña de firma.
7. Inicia sesión como **admin** → realiza la inserción final.
8. Haz clic en **Verificar firma** → el sistema debe confirmar que la firma es válida.

---

## Estructura del proyecto

```
MA2006B/
├── casa-monarca-frontend/
│   ├── api/                        # Endpoints PHP (backend)
│   │   ├── login.php
│   │   ├── crear_usuario.php
│   │   ├── editar_usuario.php
│   │   ├── eliminar_usuario.php
│   │   ├── usuarios.php
│   │   ├── crear_documento.php
│   │   ├── documentos.php
│   │   ├── avanzar_documento.php
│   │   ├── firmar_documento.php
│   │   ├── verificar_firma_documento.php
│   │   ├── generar_llaves_coordinador.php
│   │   ├── crear_migrante_directo.php
│   │   ├── migrantes.php
│   │   ├── solicitudes_push.php
│   │   ├── crear_solicitud_push.php
│   │   ├── validar_sesion.php
│   │   └── ...
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AdminPanel.jsx
│   │   │   ├── CrearUsuario.jsx
│   │   │   ├── EditarUsuario.jsx
│   │   │   ├── GestorDocumentos.jsx
│   │   │   ├── Migrantes.jsx
│   │   │   ├── CrearMigrante.jsx
│   │   │   └── SolicitudesPush.jsx
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── uploads/                    # Archivos subidos por el sistema
│   ├── conexion.php                # Configuración de conexión a MySQL
│   ├── vite.config.js
│   ├── package.json
│   └── index.html
├── database.sql                    # Schema de la BD + datos iniciales
└── README.md
```

---

## Contribuciones

¿Quieres colaborar o adaptar este proyecto para otra organización?

### Para empezar

1. Descarga o clona el proyecto:
   ```bash
   git clone <url-del-repositorio>
   ```
2. Sigue los pasos de instalación de este README.
3. Explora el código: los endpoints PHP están en `api/`, el frontend React en `src/pages/`.
4. Crea una rama con un nombre descriptivo:
   ```bash
   git checkout -b feat/nombre-de-tu-cambio
   ```
5. Realiza tus cambios, asegúrate de que el sistema sigue funcionando (ver [Pruebas básicas](#pruebas-básicas)) y abre un Pull Request con una descripción clara de qué cambiaste y por qué.

### Guías de estilo

- **PHP**: usa `mysqli` con prepared statements para todas las consultas; nunca concatenes datos del usuario directamente en SQL.
- **React**: un archivo por componente; usa `fetch` para llamadas al backend, no librerías de HTTP adicionales.
- **Commits**: mensajes en español, imperativo, descriptivos (`Agrega validación de vigencia en login`, no `fix stuff`).

---

## Pruebas básicas

Las siguientes pruebas manuales verifican que la instalación funciona correctamente:

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Login con `admin@demo.com` y contraseña correcta | Dashboard cargado con nombre y rol `admin` |
| 2 | Login con contraseña incorrecta | Mensaje: "Contraseña incorrecta" |
| 3 | Crear un usuario nuevo desde el Panel de Administración | Usuario aparece en la lista |
| 4 | Subir un documento en el Gestor de Documentos | Documento en etapa V — Ventanilla |
| 5 | Aprobar el documento como operador | Documento pasa a etapa O — Operador |
| 6 | Firmar el documento como coordinador | Ticket de firma generado; documento en etapa C |
| 7 | Verificar la firma del documento | Sistema indica "firma válida" |
| 8 | Realizar inserción final como admin | Documento en etapa A — Finalizado |
| 9 | Cambiar estado de un usuario a `inactivo` e intentar login | Mensaje: "El usuario no está activo" |
| 10 | Registrar un migrante nuevo | Expediente aparece en el módulo de migrantes |

---

## Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

## Contacto

Desarrollado por el **Equipo 5** del bloque MA2006B — Tecnológico de Monterrey, Campus Monterrey (2026).

| Nombre | Matrícula | Correo |
|---|---|---|
| Alberto Rodríguez Reyes | A01383805 | A01383805@tec.mx |
| Diego Alberto Rodríguez Ruiz | A01571638 | A01571638@tec.mx |
| Rubén Jiménez Sarmiento | A01286256 | A01286256@tec.mx |
| Hector Alonso Flores Meléndez | A01571545 | A01571545@tec.mx |
| Valeria García Hernández | A01742811 | A01742811@tec.mx |

Profesores: Raúl Gómez, Anas Wajid y Alberto F. Martínez.
