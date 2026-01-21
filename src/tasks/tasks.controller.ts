import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

/**
 * Controlador de Tareas
 *
 * Gestiona las solicitudes HTTP para operaciones de gestión de tareas. Implementa endpoints RESTful
 * para operaciones CRUD con extracción de contexto del usuario del encabezado 'x-user-id'.
 */
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   * POST /tasks
   * Crea una nueva tarea para el usuario autenticado.
   * La tarea se asigna al usuario especificado en el encabezado 'x-user-id'.
   */
  @Post()
  create(
    @Body() createTaskDto: CreateTaskDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.tasksService.create(createTaskDto, userId ?? 'system');
  }

  /**
   * GET /tasks
   * Obtiene una lista paginada de tareas visibles para el usuario (tareas propias + tareas públicas de otros).
   * Soporta paginación a través de parámetros de consulta.
   */
  @Get()
  findAll(
    @Headers('x-user-id') userId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.tasksService.findAll(userId ?? 'system', +page, +limit);
  }

  /**
   * GET /tasks/:id
   * Obtiene una tarea específica por su ID.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(+id);
  }

  /**
   * PATCH /tasks/:id
   * Actualiza una tarea con modificaciones parciales. Solo el propietario de la tarea puede realizar esta operación.
   * Devuelve ForbiddenException si el usuario no es el propietario de la tarea.
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.tasksService.update(+id, updateTaskDto, userId ?? 'system');
  }

  /**
   * DELETE /tasks/:id
   * Elimina una tarea del sistema. Solo el propietario de la tarea puede eliminar sus propias tareas.
   * Devuelve ForbiddenException si el usuario no es el propietario de la tarea.
   */
  @Delete(':id')
  remove(@Param('id') id: string, @Headers('x-user-id') userId?: string) {
    return this.tasksService.remove(+id, userId ?? 'system');
  }
}
