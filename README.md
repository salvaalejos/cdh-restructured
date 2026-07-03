# CDH Production - Arquitectura Reestructurada

Este repositorio contiene la nueva versión de la plataforma CDH, separada en Backend (ElysiaTS + Prisma) y Frontend (React + Vite). 

## Requisitos Previos
1. [Bun](https://bun.sh/) (Runtime de JavaScript/TypeScript).
2. [Docker](https://www.docker.com/) (Para la base de datos PostgreSQL).

## Paso a Paso para Ejecutar el Proyecto

### 1. Iniciar la Base de Datos (Docker)
En la raíz del proyecto (`cdh-restructured`), ejecuta el siguiente comando para levantar el contenedor de PostgreSQL (en el puerto 6543):
```bash
docker-compose up -d
```

### 2. Configurar y Ejecutar el Backend
Abre una terminal y entra a la carpeta del backend:
```bash
cd backend
```

Instala las dependencias:
```bash
bun install
```

Empuja el esquema a la base de datos y genera el cliente de Prisma:
```bash
bunx prisma db push
```

Puebla la base de datos con los usuarios de prueba (Admin y Encuestador):
```bash
bunx prisma db seed
```

Inicia el servidor backend en modo desarrollo:
```bash
bun run dev
```
*El backend estará disponible en `http://localhost:3000`*

### 3. Configurar y Ejecutar el Frontend
Abre **otra terminal** y entra a la carpeta del frontend:
```bash
cd frontend
```

Instala las dependencias:
```bash
bun install
```

Inicia el servidor frontend de React:
```bash
bun run dev
```
*El frontend estará disponible en `http://localhost:5173`*

## Usuarios de Prueba (Seed)
Una vez ejecutado el comando `bunx prisma db seed`, puedes iniciar sesión con las siguientes cuentas de prueba:

- **Administrador:**
  - **Usuario:** `admin`
  - **Contraseña:** `admin123`

- **Encuestador:**
  - **Usuario:** `encuestador_01`
  - **Contraseña:** `encuestador123`

- **Admin Temporal / Invitado (Rol 2):**
  - Se puede crear directamente desde el panel de gestión de usuarios usando el usuario Administrador.
  - Al seleccionar este rol, aparecerá un panel de permisos granulares (`manageUsers`, `viewSurveys`, etc.).
  - **Restricciones Automáticas:**
    - La barra de navegación lateral filtra automáticamente los módulos a los que no tiene acceso.
    - Se impide el acceso directo vía URL mediante componentes guardián en React (`PermissionRoute`).
    - Las operaciones sensibles (como eliminar encuestas o crear usuarios) validan el acceso en el backend, devolviendo `403 Forbidden` si se intenta evadir el sistema.
    - Este rol no puede modificar su propia cuenta ni afectar a los administradores principales.
