# Casa Monarca - Frontend

Sistema de gestion para Casa Monarca. Frontend en React + Vite con backend PHP y base de datos MySQL.

## Arquitectura

```
Navegador (:5173)  -->  Vite (dev server + proxy)
                             |
                             | /api/*
                             v
                    Apache (:80)  -->  PHP  -->  MySQL (:3306)
```

El frontend corre en el puerto 5173 con Vite. Las llamadas a `/api` se redirigen automaticamente a Apache (puerto 80), que ejecuta los archivos PHP en la carpeta `api/`. Los PHP se conectan a MySQL para leer y escribir datos.

## Requisitos previos

- **Node.js** v18 o superior — [descargar aqui](https://nodejs.org)
- **XAMPP** — [descargar aqui](https://www.apachefriends.org)

Para verificar que Node.js esta instalado:
```bash
node --version
npm --version
```

## Instalacion paso a paso

### 1. Clonar el proyecto en XAMPP

Colocar la carpeta del proyecto en:
```
C:\xampp\htdocs\casa-monarca-frontend\
```

Esto es necesario porque Apache (XAMPP) sirve archivos desde `htdocs`. Si el proyecto esta en otro lado (como Downloads), el backend PHP no sera accesible.

### 2. Iniciar XAMPP

Abrir el panel de control de XAMPP y encender:
- **Apache** — sirve los archivos PHP del backend
- **MySQL** — la base de datos donde se guardan usuarios, migrantes, documentos, etc.

Ambos deben aparecer en verde.

> Si MySQL da error de "puerto 3306 ocupado": abrir Administrador de tareas > Servicios > buscar "MySQL" > Detener. Luego reiniciar desde XAMPP.

### 3. Crear la base de datos

El proyecto necesita una base de datos MySQL llamada `casa_monarca`. Para crearla:

1. Abrir `http://localhost/phpmyadmin` en el navegador
2. Ir a la pestana **SQL**
3. Copiar y pegar todo el contenido del archivo `database.sql` (esta en la raiz del proyecto)
4. Clic en **Ejecutar**

Esto crea la base de datos, las 6 tablas necesarias, y un usuario administrador de prueba.

### 4. Configurar la conexion a MySQL

Abrir el archivo `conexion.php` en la raiz del proyecto y verificar que los datos coincidan con tu instalacion de MySQL:

```php
$host = "localhost";
$usuario = "root";
$password = "";        // en XAMPP por defecto es vacio
$base_datos = "casa_monarca";
```

> En la mayoria de instalaciones de XAMPP el password de root es vacio (`""`). Si configuraste uno diferente, cambialo aqui.

### 5. Instalar dependencias de Node

Abrir una terminal en la carpeta del proyecto y ejecutar:

```bash
npm install
```

Esto descarga todas las librerias (React, Vite, Bootstrap, etc.) en la carpeta `node_modules/`. Solo se necesita hacer una vez.

### 6. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Vite levantara el servidor en `http://localhost:5173`. Abrir esa URL en el navegador.

### 7. Iniciar sesion

Credenciales del usuario de prueba:

| Campo | Valor |
|-------|-------|
| Email | `admin@demo.com` |
| Password | `casa_monarca_pass` |

## Estructura del proyecto

```
casa-monarca-frontend/
├── api/                  # Backend PHP (endpoints)
├── src/                  # Frontend React
│   ├── pages/            # Paginas (Login, Dashboard, etc.)
│   └── ...
├── conexion.php          # Conexion a MySQL
├── database.sql          # Schema + datos iniciales
├── vite.config.js        # Config de Vite (proxy a Apache)
├── package.json          # Dependencias de Node
└── index.html            # Punto de entrada HTML
```

## Comandos disponibles

| Comando | Que hace |
|---------|----------|
| `npm run dev` | Inicia el servidor de desarrollo (puerto 5173) |
| `npm run build` | Genera el build de produccion en `dist/` |
| `npm run preview` | Sirve el build de produccion localmente |
| `npm run lint` | Ejecuta ESLint para revisar el codigo |

## Solucion de problemas

**"Respuesta invalida del servidor" al hacer login:**
- Verificar que Apache y MySQL estan encendidos en XAMPP
- Abrir `http://localhost/casa-monarca-frontend/conexion.php` — si muestra "Access denied", revisar el password en `conexion.php`

**Error 500 en los endpoints PHP:**
- Verificar que la base de datos `casa_monarca` existe en phpMyAdmin
- Revisar que todas las tablas fueron creadas (ejecutar `database.sql`)

**Puerto 3306 ocupado:**
- Otro servicio de MySQL esta corriendo. Detenerlo desde Administrador de tareas > Servicios
 