import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UseGuards,
  UploadedFile,
  BadRequestException,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

/**
 * Controlador de Tareas
 *
 * Gestiona las solicitudes HTTP para operaciones de gestión de tareas. Implementa endpoints RESTful
 * para operaciones CRUD con autenticación JWT.
 */
@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   * POST /tasks
   * Crea una nueva tarea para el usuario autenticado.
   */
  @Post()
  @ApiOperation({
    summary: 'Crear nueva tarea',
    description:
      'Crea una tarea privada o pública según el usuario especifique',
  })
  @ApiResponse({
    status: 201,
    description: 'Tarea creada exitosamente',
    example: {
      id: 1,
      title: 'Mi tarea',
      description: 'Descripción de la tarea',
      status: 'PENDING',
      deliveryDate: '2026-02-15',
      isPublic: false,
      userId: 'uuid-user',
      createdAt: '2026-01-21T12:00:00Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos en la solicitud',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - falta JWT válido',
  })
  create(
    @Body() createTaskDto: CreateTaskDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.tasksService.create(createTaskDto, req.user.id);
  }

  /**
   * GET /tasks
   * Obtiene una lista paginada de tareas visibles para el usuario (tareas propias + tareas públicas de otros).
   * Soporta paginación, filtrado avanzado y ordenamiento a través de parámetros de consulta.
   *
   * Query Parameters:
   * - page: número de página (default: 1)
   * - limit: resultados por página (default: 10)
   * - status: filtrar por estado (PENDING, IN_PROGRESS, DONE)
   * - responsible: filtrar por responsable
   * - startDate: fecha inicial para filtro de entrega (YYYY-MM-DD)
   * - endDate: fecha final para filtro de entrega (YYYY-MM-DD)
   * - tags: filtrar por tags (separados por comas)
   * - orderBy: campo para ordenar (createdAt, deliveryDate, status, title, updatedAt)
   * - orderDirection: ASC o DESC
   */
  @Get()
  @ApiOperation({
    summary: 'Listar tareas con paginación y filtros',
    description:
      'Obtiene todas las tareas del usuario actual (privadas) más todas las tareas públicas de otros usuarios. Soporta paginación, filtrado y ordenamiento.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Resultados por página (default: 10)',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filtrar por estado',
    enum: ['PENDING', 'IN_PROGRESS', 'DONE'],
  })
  @ApiQuery({
    name: 'responsible',
    required: false,
    type: String,
    description: 'Filtrar por responsable',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Fecha inicial (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Fecha final (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    type: String,
    description: 'Filtrar por tags (separados por comas)',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    type: String,
    description: 'Campo para ordenar',
    enum: ['createdAt', 'deliveryDate', 'status', 'title', 'updatedAt'],
  })
  @ApiQuery({
    name: 'orderDirection',
    required: false,
    type: String,
    description: 'Dirección de orden',
    enum: ['ASC', 'DESC'],
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de tareas obtenida correctamente',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  findAll(
    @Request() req: AuthenticatedRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('responsible') responsible?: string,
    @Query('tags') tags?: string,
    @Query('orderBy') orderBy = 'createdAt',
    @Query('orderDirection') orderDirection: 'ASC' | 'DESC' = 'DESC',
  ) {
    return this.tasksService.findAll(
      req.user.id,
      +page,
      +limit,
      status,
      startDate,
      endDate,
      responsible,
      tags,
      orderBy,
      orderDirection,
    );
  }

  /**
   * GET /tasks/:id
   * Obtiene una tarea específica por su ID.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener tarea por ID',
    description:
      'Obtiene los detalles completos de una tarea. Solo el propietario puede ver tareas privadas.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la tarea',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Tarea obtenida correctamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Tarea no encontrada',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para ver esta tarea privada',
  })
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.tasksService.findOne(+id, req.user?.id);
  }

  /**
   * PUT /tasks/:id
   * Actualiza completamente una tarea. Solo el propietario de la tarea privada o cualquiera para pública.
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar tarea',
    description:
      'Actualiza una tarea. Solo el propietario puede editar tareas privadas.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la tarea',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Tarea actualizada correctamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Tarea no encontrada',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para editar esta tarea',
  })
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.tasksService.update(+id, updateTaskDto, req.user.id);
  }

  /**
   * DELETE /tasks/:id
   * Elimina una tarea del sistema. Solo el propietario de la tarea privada o cualquiera para pública.
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar tarea',
    description:
      'Elimina una tarea permanentemente. Solo el propietario puede eliminar tareas privadas.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la tarea',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Tarea eliminada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Tarea no encontrada',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permiso para eliminar esta tarea',
  })
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.tasksService.remove(+id, req.user.id);
  }

  /**
   * POST /tasks/:id/upload
   * Carga un archivo adjunto a una tarea.
   * Solo soporta: PDF, PNG, JPG (máximo 5MB)
   */
  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Subir archivo adjunto a tarea',
    description:
      'Carga un archivo (PDF, PNG, JPG max 5MB) a una tarea. Almacenado en MinIO.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la tarea',
    example: 1,
  })
  @ApiResponse({
    status: 201,
    description: 'Archivo subido correctamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Archivo no proporcionado o formato inválido',
  })
  @ApiResponse({
    status: 404,
    description: 'Tarea no encontrada',
  })
  @ApiResponse({
    status: 413,
    description: 'Archivo muy grande (máximo 5MB)',
  })
  async uploadFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Request() req: AuthenticatedRequest,
  ): Promise<{
    success: boolean;
    message: string;
    file: { url: string; filename: string; size: number; mimetype: string };
  }> {
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo');
    }

    return await this.tasksService.uploadFile(+id, file, req.user.id);
  }
}
