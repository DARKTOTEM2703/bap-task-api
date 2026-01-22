# API de Gestión de Tareas

Sistema REST para gestión de tareas con autenticación por usuario, auditoría completa y control de acceso basado en roles.

## Características

- CRUD completo de tareas (Crear, Leer, Actualizar, Eliminar)
- Paginación en listados con metadatos
- Control de acceso: cada usuario solo ve sus tareas + tareas públicas
- Tareas públicas/privadas configurable
- Registro de auditoría de todos los cambios
- Validación robusta de entrada con class-validator
- Documentación interactiva con Swagger/OpenAPI
- Escaneo de secretos con ggshield
- Base de datos MySQL con TypeORM
- Docker Compose para desarrollo

## Requisitos Previos

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Docker** y **Docker Compose** (para MySQL y MinIO)
- **Git**

## Instalación Rápida (5 minutos)

### Opción 1: Script Automático (Recomendado)

```bash
git clone https://github.com/DARKTOTEM2703/bap-task-api.git
cd bap-task-api
chmod +x start-all.sh
./start-all.sh
```

El script automáticamente:
- Inicia contenedores Docker (MySQL, phpMyAdmin, MinIO)
- Instala dependencias npm
- Inicia el servidor en modo desarrollo
- Muestra URLs de todos los servicios

**Después de 2-3 minutos, verás:**
```
✓ SISTEMA LISTO
 API:              http://localhost:3000
 Swagger:          http://localhost:3000/api
 phpMyAdmin:       http://localhost:8080 (user: bap_user)
 MinIO Console:    http://localhost:9001 (user: minioadmin)
```

### Opción 2: Instalación Manual

#### 1. Clonar el repositorio

```bash
git clone https://github.com/DARKTOTEM2703/bap-task-api.git
cd bap-task-api
```

#### 2. Instalar dependencias

```bash
npm install
```

#### 3. Crear archivo `.env` desde la plantilla

```bash
cp .env.example .env
```

Edita `.env` con tus valores (o usa los valores por defecto para desarrollo local):

```env
# Base de datos MySQL
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=bap_user
DB_PASS=bap_password
DB_NAME=tasks_db
TYPEORM_SYNC=true

# JWT (genera una clave segura en producción)
JWT_SECRET=your_jwt_secret_key_minimum_32_characters_long

# MinIO S3 (almacenamiento de archivos)
MINIO_ENDPOINT=http://127.0.0.1:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=tasks

# Contenedores Docker
MYSQL_ROOT_PASSWORD=root_password
MYSQL_DATABASE=tasks_db
MYSQL_USER=bap_user
MYSQL_PASSWORD=bap_password
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

# Aplicación
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

#### 4. Iniciar contenedores Docker

```bash
docker-compose up -d
```

Espera 20 segundos a que MySQL inicie completamente.

#### 5. Ejecutar la aplicación

```bash
npm run start:dev
```

La API estará disponible en: **http://localhost:3000**

## Documentación API

### Acceder a Swagger (UI Interactiva)

Una vez que el servidor está corriendo:
```
http://localhost:3000/api
```

Desde aquí puedes probar todos los endpoints directamente en el navegador.

### Herramientas Auxiliares

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **API REST** | http://localhost:3000 | - |
| **Swagger UI** | http://localhost:3000/api | - |
| **phpMyAdmin** | http://localhost:8080 | user: `bap_user` / pass: `bap_password` |
| **MinIO Console** | http://localhost:9001 | user: `minioadmin` / pass: `minioadmin` |

### Ejemplos de Uso

#### Registro de Usuario (POST /auth/register)
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "developer@example.com",
    "password": "SecurePassword123",
    "name": "Jafeth Developer"
  }'
```

Respuesta:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "developer@example.com",
    "name": "Jafeth Developer"
  }
}
```

#### Crear Tarea (POST /tasks)
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Implementar autenticación",
    "description": "Agregar JWT tokens y validación al sistema",
    "deliveryDate": "2026-02-15T18:00:00Z",
    "status": "PENDING",
    "responsible": "Jafeth",
    "tags": ["backend", "security"],
    "isPublic": false
  }'
```

#### Listar Tareas con Paginación y Filtros (GET /tasks)
```bash
curl -X GET "http://localhost:3000/tasks?page=1&limit=10&status=PENDING&orderBy=deliveryDate&orderDirection=ASC" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Subir Archivo a Tarea (POST /tasks/:id/upload)
```bash
curl -X POST http://localhost:3000/tasks/1/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@documento.pdf"
```

Máximo: 5MB. Formatos: PDF, PNG, JPG

#### Obtener una Tarea (GET /tasks/:id)
```bash
curl -X GET http://localhost:3000/tasks/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Actualizar Tarea (PUT /tasks/:id)
```bash
curl -X PUT http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "IN_PROGRESS",
    "comments": "Iniciado desarrollo"
  }'
```

#### Eliminar Tarea (DELETE /tasks/:id)
```bash
curl -X DELETE http://localhost:3000/tasks/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Nota:** Usa los ejemplos en **Swagger UI** (http://localhost:3000/api) para una interfaz interactiva más cómoda.

## Estructura del Proyecto

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

## Seguridad

### Autenticación JWT

El API usa **JWT (Bearer Token)** para autenticación:

1. **Registra o inicia sesión** en `/auth/register` o `/auth/login`
2. **Recibe un token** en la respuesta
3. **Usa el token** en el header `Authorization: Bearer TOKEN` para todas las peticiones

Válido por: **24 horas**

### Control de Acceso

- Solo el propietario puede ver/editar/eliminar sus tareas privadas
- Las tareas públicas (`isPublic: true`) son visibles y editables para todos
- Retorna `403 Forbidden` para intentos no autorizados
- Retorna `401 Unauthorized` si el token es inválido o expirado

### Validación de Archivos

Triple capa de validación para uploads:
1. **Express middleware**: Rechaza requests >5MB antes de procesarlas
2. **Stream chunking**: Monitorea tamaño mientras se recibe
3. **Final validation**: Valida tamaño, MIME type y extensión

Formatos permitidos: **PDF, PNG, JPG** (máximo 5MB)

### Auditoría

Todas las acciones se registran automáticamente:
- CREATE_TASK, UPDATE_TASK, DELETE_TASK, UPLOAD_FILE
- Accesible via `GET /audit` (requiere autenticación)

## Configuración Avanzada

### Variables de Entorno Disponibles

```env
# Base de datos
DB_HOST              # Host MySQL (default: 127.0.0.1)
DB_PORT              # Puerto MySQL (default: 3306)
DB_USER              # Usuario MySQL
DB_PASS              # Contraseña MySQL
DB_NAME              # Nombre de base de datos
TYPEORM_SYNC         # Auto-crear tablas (true/false)

# JWT
JWT_SECRET           # Clave secreta (min 32 caracteres)

# MinIO S3
MINIO_ENDPOINT       # URL de MinIO
MINIO_ACCESS_KEY     # Access key
MINIO_SECRET_KEY     # Secret key
MINIO_BUCKET         # Nombre del bucket

# Aplicación
NODE_ENV             # development | production | test
PORT                 # Puerto (default: 3000)
ALLOWED_ORIGINS      # CORS origins (separadas por coma)
```

### Detener Contenedores

```bash
docker-compose down
```

### Ver Logs

```bash
# API
npm run start:dev

# Docker (MySQL, MinIO)
docker-compose logs -f

# Base de datos
docker-compose exec db mysql -u bap_user -p tasks_db
```

## Testing

```bash
# Tests unitarios
npm run test

# Tests E2E
npm run test:e2e

# Cobertura
npm run test:cov
```

## Verificación Rápida (Después de instalar)

1. **¿El servidor está corriendo?**
   ```bash
   curl http://localhost:3000
   # Debe retornar: Hello World!
   ```

2. **¿Swagger está disponible?**
   ```
   Abre en el navegador: http://localhost:3000/api
   ```

3. **¿MySQL está activo?**
   ```bash
   docker-compose ps
   # Debe mostrar: db, phpmyadmin, minio con estado "Up"
   ```

4. **¿Crear un usuario?**
   ```bash
   curl -X POST http://localhost:3000/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "Password123",
       "name": "Test User"
     }'
   ```
   Debe retornar un `access_token`.

5. **¿Crear una tarea?**
   ```bash
   # Reemplaza TOKEN con el access_token del paso anterior
   curl -X POST http://localhost:3000/tasks \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{
       "title": "Test Task",
       "description": "Test description",
       "deliveryDate": "2026-12-31T23:59:59Z",
       "isPublic": true
     }'
   ```
   Debe retornar la tarea creada.

## Troubleshooting

### "Port 3000 already in use"
```bash
# Cambia el puerto en .env
PORT=3001
```

### "MySQL connection failed"
```bash
# Asegúrate que Docker está corriendo y MySQL está listo
docker-compose ps
docker-compose logs db
# Espera 30 segundos después de docker-compose up
```

### "MinIO bucket not found"
MinIO crea el bucket automáticamente al primer upload. Si necesitas configurarlo manualmente:
- Ve a http://localhost:9001
- Usa credenciales: `minioadmin` / `minioadmin`

### "JWT_SECRET too short"
Genera una clave segura:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Documentación Adicional

- [NestJS Docs](https://docs.nestjs.com)
- [TypeORM Docs](https://typeorm.io)
- [Swagger/OpenAPI](https://swagger.io)
- [JWT](https://jwt.io)

## Modelos de Datos

### Tabla: `tasks`
- id, title, description, status, deliveryDate
- comments, responsible, tags, isPublic, userId
- createdAt, updatedAt

### Tabla: `audit_logs`
- id, userId, action, taskId, details, timestamp

## Stack Tecnológico

- **NestJS** 11.x
- **TypeScript** 5.x
- **TypeORM** 0.3.x
- **MySQL** 8.0
- **Swagger** 7.x
- **Docker** Compose

## Repositorio

GitHub: https://github.com/DARKTOTEM2703/bap-task-api

## Licencia

MIT
