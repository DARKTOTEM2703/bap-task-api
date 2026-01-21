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
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   * POST /tasks
   * Crea una nueva tarea para el usuario autenticado.
   */
  @Post()
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
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(+id);
  }

  /**
   * PUT /tasks/:id
   * Actualiza completamente una tarea. Solo el propietario de la tarea privada o cualquiera para pública.
   */
  @Put(':id')
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

    return this.tasksService.uploadFile(+id, file, req.user.id);
  }
}
