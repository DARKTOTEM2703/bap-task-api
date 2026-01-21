<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Descripción

API REST para un Sistema de Gestión de Tareas.  
Desarrollado con NestJS siguiendo una arquitectura modular y escalable, con prácticas de DevSecOps y documentación automática.

Permite gestión completa de tareas (CRUD), asignación de responsables, auditoría de cambios y validación de datos.

## Stack tecnológico

* Framework: NestJS (Node.js)
* Lenguaje: TypeScript
* Base de datos: MySQL 8
* ORM: TypeORM
* Contenedores: Docker & Docker Compose
* Documentación: Swagger (OpenAPI)
* Seguridad:
  * Husky: Git hooks para validación local.
  * ggshield / GitGuardian: escaneo de secretos.
  * GitHub Actions: CI/CD con auditoría de seguridad.

---

## Configuración del proyecto

### 1. Instalación de dependencias
```bash
npm install
```

### 2. Variables de entorno
Copia el archivo de ejemplo y configura tus credenciales (Base de Datos, JWT, etc.):
```bash
cp .env.example .env
```

### 3. Levantar infraestructura (Base de datos)
```bash
docker-compose up -d
```

Ejecución
```bash
# Modo desarrollo (hot-reload)
npm run start:dev

# Modo producción
npm run start:prod
```

Una vez iniciada la aplicación, puedes acceder a:
- API: http://localhost:3000
- Documentación Swagger: http://localhost:3000/api

## Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Estrategia de seguridad (DevSecOps)

Se implementa una estrategia de defensa en profundidad para la gestión de secretos:

Shift-left (local):
* Husky ejecuta hooks de pre-commit.
* ggshield escanea archivos antes de cada commit para evitar subir credenciales.
* Instalación de hooks: `npm run prepare`

CI/CD (remoto):
* Workflow en GitHub Actions que escanea el repositorio en cada push o pull request buscando vulnerabilidades o secretos expuestos.

## Autor
Jafeth Gamboa  
Desarrollador Full Stack

## Licencia
MIT
