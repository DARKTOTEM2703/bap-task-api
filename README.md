# API de Gestión de Tareas

Sistema REST para gestión de tareas con autenticación por usuario, auditoría completa y control de acceso basado en roles.

## 🚀 Características

- ✅ CRUD completo de tareas (Crear, Leer, Actualizar, Eliminar)
- ✅ Paginación en listados con metadatos
- ✅ Control de acceso: cada usuario solo ve sus tareas + tareas públicas
- ✅ Tareas públicas/privadas configurable
- ✅ Registro de auditoría de todos los cambios
- ✅ Validación robusta de entrada con class-validator
- ✅ Documentación interactiva con Swagger/OpenAPI
- ✅ Escaneo de secretos con ggshield
- ✅ Base de datos MySQL con TypeORM
- ✅ Docker Compose para desarrollo

## 📋 Requisitos Previos

- **Node.js** >= 16.x
- **npm** >= 8.x
- **Docker** y **Docker Compose** (para la base de datos)
- **Git**

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/DARKTOTEM2703/bap-task-api.git
cd bap-task-api
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env` en la raíz del proyecto:

```bash
# Base de datos
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=bap_user
DB_PASS=bap_password
DB_NAME=tasks_db

# TypeORM
TYPEORM_SYNC=true

# MySQL Container
MYSQL_ROOT_PASSWORD=root_password
MYSQL_DATABASE=tasks_db
MYSQL_USER=bap_user
MYSQL_PASSWORD=bap_password
```

### 4. Levantar la base de datos

```bash
docker-compose up -d
```

### 5. Ejecutar la aplicación

#### Modo desarrollo:
```bash
npm run start:dev
```

#### Modo producción:
```bash
npm run build
npm run start:prod
```

La aplicación estará disponible en: `http://localhost:3000`

## 📚 Documentación API

### Swagger/OpenAPI

Acceder a la documentación interactiva en:
```
http://localhost:3000/api
```

### Endpoints disponibles

#### 1. Crear Tarea (POST)
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -H "x-user-id: usuario-123" \
  -d '{
    "title": "Implementar autenticación",
    "description": "Agregar JWT tokens al sistema",
    "deliveryDate": "2026-02-15",
    "status": "PENDING",
    "isPublic": false
  }'
```

#### 2. Obtener todas las tareas (GET)
```bash
curl -X GET "http://localhost:3000/tasks?page=1&limit=10" \
  -H "x-user-id: usuario-123"
```

#### 3. Obtener una tarea específica (GET)
```bash
curl -X GET http://localhost:3000/tasks/1
```

#### 4. Actualizar una tarea (PUT)
```bash
curl -X PUT http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -H "x-user-id: usuario-123" \
  -d '{
    "status": "IN_PROGRESS",
    "comments": "Iniciado desarrollo"
  }'
```

#### 5. Eliminar una tarea (DELETE)
```bash
curl -X DELETE http://localhost:3000/tasks/1 \
  -H "x-user-id: usuario-123"
```

## 📊 Estructura del Proyecto

```
src/
├── app.controller.ts         # Controlador raíz
├── app.module.ts             # Módulo raíz (configuración DB)
├── app.service.ts            # Servicio raíz
├── main.ts                   # Punto de entrada
├── tasks/                    # Módulo de tareas
│   ├── dto/
│   │   ├── create-task.dto.ts
│   │   └── update-task.dto.ts
│   ├── entities/
│   │   └── task.entity.ts
│   ├── tasks.controller.ts
│   ├── tasks.service.ts
│   └── tasks.module.ts
└── audit/                    # Módulo de auditoría
    ├── entities/
    │   └── audit.entity.ts
    ├── audit.service.ts
    └── audit.module.ts
```

## 🔐 Seguridad

### Autenticación

Utiliza header `x-user-id` para identificar el usuario:
```
x-user-id: usuario-123
```

### Autorización

- ✅ Los usuarios solo pueden modificar/eliminar sus propias tareas
- ✅ Las tareas públicas (`isPublic: true`) son visibles para todos
- ✅ Retorna `403 Forbidden` en intentos no autorizados

### Escaneo de Secretos

El proyecto usa **ggshield** y **Husky** para prevenir commits con secretos.

## 📦 Scripts Disponibles

```bash
npm run start:dev      # Desarrollo con hot reload
npm run start          # Modo normal
npm run build          # Build para producción
npm run start:prod     # Producción
npm run test           # Tests unitarios
npm run test:e2e       # Tests E2E
npm run lint           # ESLint + fix automático
```

## 🗄️ Modelos de Datos

### Tabla: `tasks`
- id, title, description, status, deliveryDate
- comments, responsible, tags, isPublic, userId
- createdAt, updatedAt

### Tabla: `audit_logs`
- id, userId, action, taskId, details, timestamp

## 📚 Stack Tecnológico

- **NestJS** 11.x
- **TypeScript** 5.x
- **TypeORM** 0.3.x
- **MySQL** 8.0
- **Swagger** 7.x
- **Docker** Compose

## 📧 Repositorio

GitHub: https://github.com/DARKTOTEM2703/bap-task-api

## 📄 Licencia

MIT
