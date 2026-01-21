# Prueba del Sistema - API REST de Gestión de Tareas

## 📋 Estado del Sistema

- ✅ **Backend NestJS**: http://localhost:3000 (watch mode)
- ✅ **Swagger/OpenAPI**: http://localhost:3000/api
- ✅ **MySQL**: localhost:3306 (usuario: `bap_user`, contraseña: `bap_password`)
- ✅ **phpMyAdmin**: http://localhost:8080 (usuario: `bap_user`, contraseña: `bap_password`)
- ✅ **MinIO API**: http://localhost:9000 (usuario: `minioadmin`, contraseña: `minioadmin`)
- ✅ **MinIO Console**: http://localhost:9001 (usuario: `minioadmin`, contraseña: `minioadmin`)

---

## 🔑 Flujo de Prueba Recomendado

### 1. Registrar Usuario

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario1@example.com",
    "password": "SecurePassword123",
    "name": "Juan Pérez"
  }'
```

**Respuesta esperada:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "usuario1@example.com",
    "name": "Juan Pérez"
  }
}
```

---

### 2. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario1@example.com",
    "password": "SecurePassword123"
  }'
```

**Guardar el `access_token` para las siguientes peticiones.**

---

### 3. Crear Tarea Privada

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implementar autenticación",
    "description": "Añadir JWT a la API",
    "status": "IN_PROGRESS",
    "deliveryDate": "2026-02-15",
    "responsible": "Juan Pérez",
    "tags": "backend,security",
    "isPublic": false
  }'
```

**Respuesta esperada:**
```json
{
  "id": 1,
  "title": "Implementar autenticación",
  "description": "Añadir JWT a la API",
  "status": "IN_PROGRESS",
  "deliveryDate": "2026-02-15",
  "responsible": "Juan Pérez",
  "tags": "backend,security",
  "isPublic": false,
  "userId": "uuid",
  "createdAt": "2026-01-21T12:53:10.000Z",
  "updatedAt": "2026-01-21T12:53:10.000Z"
}
```

---

### 4. Crear Tarea Pública

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Revisar documentación",
    "description": "Revisar que la documentación esté completa",
    "status": "PENDING",
    "deliveryDate": "2026-02-20",
    "isPublic": true
  }'
```

---

### 5. Listar Tareas (con paginación y filtros)

```bash
# Sin filtros
curl -X GET "http://localhost:3000/tasks?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Con filtros
curl -X GET "http://localhost:3000/tasks?page=1&limit=10&status=IN_PROGRESS&orderBy=deliveryDate&orderDirection=ASC" \
  -H "Authorization: Bearer $TOKEN"

# Con fecha de entrega
curl -X GET "http://localhost:3000/tasks?startDate=2026-01-01&endDate=2026-12-31" \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta esperada:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Implementar autenticación",
      "description": "Añadir JWT a la API",
      "status": "IN_PROGRESS",
      "deliveryDate": "2026-02-15",
      "userId": "uuid",
      "isPublic": false,
      "createdAt": "2026-01-21T12:53:10.000Z"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "filters": {
    "status": "IN_PROGRESS",
    "startDate": null,
    "endDate": null,
    "responsible": null,
    "tags": null
  },
  "sorting": {
    "orderBy": "deliveryDate",
    "orderDirection": "ASC"
  }
}
```

---

### 6. Obtener Tarea Específica

```bash
curl -X GET http://localhost:3000/tasks/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

### 7. Actualizar Tarea

```bash
curl -X PUT http://localhost:3000/tasks/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "DONE",
    "description": "Autenticación completada y probada"
  }'
```

---

### 8. Cargar Archivo Adjunto

```bash
# Crear archivo de prueba
echo "Documento de prueba" > documento.pdf

# Subir archivo
curl -X POST http://localhost:3000/tasks/1/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@documento.pdf"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Archivo cargado exitosamente",
  "file": {
    "url": "http://minio:9000/tasks-files/tasks/1/...",
    "filename": "documento.pdf",
    "size": 19,
    "mimetype": "application/pdf"
  }
}
```

---

### 9. Eliminar Tarea

```bash
curl -X DELETE http://localhost:3000/tasks/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔐 Registrar Segundo Usuario y Probar Acceso Público

```bash
# Registrar usuario 2
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario2@example.com",
    "password": "SecurePassword456",
    "name": "María López"
  }'

# Usuario 2 puede ver tareas públicas del usuario 1
curl -X GET http://localhost:3000/tasks \
  -H "Authorization: Bearer $TOKEN_USUARIO2"
```

---

## 📊 Verificar Auditoría

### Opción A: Via phpMyAdmin
1. Accede a http://localhost:8080
2. Usuario: `bap_user`, Contraseña: `bap_password`
3. Base de datos: `tasks_db`
4. Tabla: `audit_logs`

### Opción B: Via curl (si hay endpoint)
```bash
curl -X GET http://localhost:3000/audit \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🪣 Verificar MinIO

### Console Web
1. Accede a http://localhost:9001
2. Usuario: `minioadmin`, Contraseña: `minioadmin`
3. Verifica que el bucket `tasks-files` existe y contiene los archivos subidos

### Via CLI (aws-cli)
```bash
export AWS_ACCESS_KEY_ID=minioadmin
export AWS_SECRET_ACCESS_KEY=minioadmin

# Listar buckets
aws --endpoint-url http://localhost:9000 s3 ls

# Listar archivos en bucket
aws --endpoint-url http://localhost:9000 s3 ls s3://tasks-files/
```

---

## 🔗 Usar Swagger (Recomendado)

Abre en tu navegador: **http://localhost:3000/api**

- Todos los endpoints están documentados
- Puedes probar directamente desde la interfaz
- Autorización: Click en el botón "Authorize" y pega tu `access_token`

---

## 📌 Notas Importantes

- **JWT_SECRET**: Generado automáticamente en `.env`
- **MinIO Endpoint** para app: `http://minio:9000` (cuando usa docker-compose)
- **MinIO Endpoint** para pruebas locales: `http://localhost:9000`
- **Validación de archivos**: Solo PDF, PNG, JPG (máximo 5MB)
- **Campos requeridos en tarea**: `title`, `description`, `status`, `deliveryDate`

---

## 🐛 Solución de Problemas

### Backend no inicia
```bash
# Verifica que los puertos no están en uso
lsof -i :3000
lsof -i :3306
lsof -i :9000
lsof -i :8080

# Si están en uso, mata los procesos
kill -9 <PID>
```

### MySQL no conecta
```bash
# Verifica que el contenedor está corriendo
docker ps | grep mysql

# Ver logs
docker logs bap-task-api-db-1
```

### MinIO no accesible
```bash
# Verifica que el contenedor está corriendo
docker ps | grep minio

# Ver logs
docker logs bap-task-api-minio-1
```

### Detener todos los servicios
```bash
# Parar contenedores
docker compose down

# Parar backend (Ctrl+C en la terminal donde corre)
```

---

## ✅ Checklist de Prueba Completa

- [ ] Registro de usuario exitoso
- [ ] Login exitoso y obtención de JWT
- [ ] Crear tarea privada
- [ ] Crear tarea pública
- [ ] Listar tareas con paginación
- [ ] Filtrar tareas por status, fecha, responsable
- [ ] Ordenar tareas por diferentes campos
- [ ] Obtener tarea específica
- [ ] Actualizar tarea
- [ ] Cargar archivo adjunto
- [ ] Verificar archivo en MinIO
- [ ] Eliminar tarea
- [ ] Verificar auditoría en BD
- [ ] Usuario 2 puede ver tareas públicas de Usuario 1
- [ ] Usuario 1 NO puede ver tareas privadas de Usuario 2
- [ ] Swagger carga sin errores
