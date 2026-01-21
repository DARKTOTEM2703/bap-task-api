# Sistema de gestión de tareas

Deberás realizar una **API REST** que permita el funcionamiento de un sistema de gestión de tareas, utilizando las tecnologías de **Node.js** mediante un framework.  
El proyecto tendrá que estar en un **repositorio público** para permitir su consulta.

---

## Propósito
El sistema de gestión de tareas tiene como propósito el que un usuario pueda **visualizar, agregar, editar o eliminar** las tareas que requiera registrar en su día a día.  
Y debido a que el sistema es utilizado por varios usuarios, es necesario que la API identifique al usuario o sesión que está solicitando cierta información.  
*(No es necesario crear un módulo de registro y autentificación de usuarios).*

---

## Atributos de cada tarea
- **Título** (Obligatorio)  
- **Descripción** (Obligatorio)  
- **Estatus de compleción** (Obligatorio)  
- **Fecha de entrega** (Obligatorio)  
- **Comentarios** (Opcional)  
- **Responsable** (Opcional)  
- **Tags** (Opcional)  

---

## Endpoints mínimos necesarios disponibles en la API
- **GET** → Regresa información breve de todas las tareas  
- **GET** → Regresa toda la información de una tarea  
- **POST** → Crear una tarea  
- **PUT** → Editar una tarea  
- **DELETE** → Borrar una tarea  

---

## Aspectos a evaluar
- Funcionamiento de la API REST  
- Utilización de Node.js y Express  
- Estructura del proyecto  
- Documentación del código y endpoints  
- Buenas prácticas de programación  

---

## Stack sugerido
1. Nest.js o Express.js  
2. MySQL  
3. TypeOrm  

---

## Retos extra (Opcionales)

### Funcionalidades adicionales en cada tarea
- **¿Es pública?** (Obligatorio)  
- **Archivo** (Opcional, no mayor a 5MB y sólo formatos `.pdf`, `.png`, `.jpg`)  

### Consideraciones
1. Un usuario puede ver toda la lista de tareas públicas, así como editarlas, completarlas y eliminarlas.  
2. Los métodos **GET** deben funcionar para fines de paginación en el Frontend y mostrar cuántos resultados encontró en cada llamada en la misma respuesta.  
3. El sistema debe guardar una **bitácora de todos los movimientos**.  

**Nota extra:** No es obligatorio desarrollar este reto extra ni completarlo en su totalidad.

---

## Segunda opción
- **Autenticación y Autorización**: Agregar un sistema básico de autenticación utilizando tokens de acceso y así mantener rutas privadas y públicas.  
- **Paginación, Ordenamiento y Filtrado Avanzado**: Filtrar tareas según diferentes criterios, como estatus de completitud, fecha de entrega, responsable, tags, etc.  
- Tener por lo menos una **tabla menú** (de los campos opcionales) y consultar información relacionando tablas.  
- Montar Backend en un **hosting** (Heroku, Railway).  
- Documentar la API utilizando **Swagger** o similar.
---## Entrega
- Subir el proyecto a un **repositorio público** en GitHub, GitLab o Bitbucket.  
- Incluir un archivo `README.md` con instrucciones claras para ejecutar el proyecto localmente.  
- Incluir ejemplos de uso de los endpoints (puede ser en el `README.md` o en una colección de Postman).  
- Enviar el enlace del repositorio al reclutador o contacto correspondiente.
