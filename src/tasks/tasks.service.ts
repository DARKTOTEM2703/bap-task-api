import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';
import { AuditService } from '../audit/audit.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string) {
    const task = this.tasksRepository.create({
      ...createTaskDto,
      userId,
    });

    const savedTask = await this.tasksRepository.save(task);

    // Registra el evento de creación de tarea con los datos proporcionados para cumplimiento de auditoría
    await this.auditService.logAction(
      userId,
      'CREATE_TASK',
      savedTask.id,
      createTaskDto as unknown as Record<string, unknown>,
    );

    return savedTask;
  }

  async findAll(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    // Obtiene resultados paginados: tareas privadas del usuario combinadas con todas las tareas públicas de otros usuarios
    // Implementa el modelo de visibilidad basado en roles donde los usuarios pueden ver sus propias tareas y cualquier tarea pública
    const [tasks, total] = await this.tasksRepository.findAndCount({
      where: [{ userId }, { isPublic: true }],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: tasks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const task = await this.tasksRepository.findOneBy({ id });
    if (!task) throw new NotFoundException(`Task #${id} not found`);
    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, userId: string) {
    const task = await this.findOne(id);

    // Valida la propiedad del recurso: verifica que el usuario solicitante sea el propietario de la tarea antes de permitir modificaciones
    if (task.userId !== userId) {
      throw new ForbiddenException('Solo puedes actualizar tus propias tareas');
    }

    await this.tasksRepository.update(id, updateTaskDto);

    // Registra la operación de actualización en el registro de auditoría para cumplimiento normativo y propósitos de depuración
    await this.auditService.logAction(
      userId,
      'UPDATE_TASK',
      id,
      updateTaskDto as unknown as Record<string, unknown>,
    );

    return await this.findOne(id);
  }

  async remove(id: number, userId: string) {
    const task = await this.findOne(id);

    // Valida la propiedad del recurso: verifica la propiedad de la tarea antes de la eliminación para prevenir eliminaciones no autorizadas
    if (task.userId !== userId) {
      throw new ForbiddenException('Solo puedes eliminar tus propias tareas');
    }

    await this.tasksRepository.delete(id);

    // Registra el evento de eliminación con metadatos relevantes de la tarea para seguimiento histórico
    await this.auditService.logAction(userId, 'DELETE_TASK', id, {
      title: task.title,
    });

    return { message: 'Tarea eliminada exitosamente' };
  }

  /**
   * Carga un archivo adjunto a una tarea
   * @param id - ID de la tarea
   * @param file - Archivo a cargar
   * @param userId - ID del usuario que carga el archivo
   * @returns Objeto con URL del archivo y metadatos
   */
  async uploadFile(
    id: number,
    file: Express.Multer.File,
    userId: string,
  ): Promise<{
    success: boolean;
    message: string;
    file: { url: string; filename: string; size: number; mimetype: string };
  }> {
    const task = await this.findOne(id);

    // Validar autorización: solo propietario de tareas privadas, cualquiera para públicas
    if (!task.isPublic && task.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para cargar archivos en esta tarea',
      );
    }

    try {
      // Subir archivo a MinIO
      const fileData = await this.storageService.uploadFile(file, id);

      // Actualizar tarea con datos del archivo
      await this.tasksRepository.update(id, {
        fileUrl: fileData.url,
        fileName: fileData.filename,
        fileKey: `tasks/${id}/${Date.now()}-${file.originalname}`,
      });

      // Registrar en auditoría
      await this.auditService.logAction(userId, 'UPLOAD_FILE', id, {
        filename: fileData.filename,
        size: fileData.size,
        url: fileData.url,
      });

      return {
        success: true,
        message: 'Archivo cargado exitosamente',
        file: fileData,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Error al cargar archivo: ${errorMessage}`);
    }
  }
}
