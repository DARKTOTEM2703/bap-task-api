import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';
import { AuditService } from '../audit/audit.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string) {
    try {
      const task = this.tasksRepository.create({
        ...createTaskDto,
        userId,
      });

      const savedTask = await this.tasksRepository.save(task);
      this.logger.log(
        `Tarea creada exitosamente: ${savedTask.id} por usuario ${userId}`,
      );

      // Registra el evento de creación de tarea con los datos proporcionados para cumplimiento de auditoría
      await this.auditService.logAction(
        userId,
        'CREATE_TASK',
        savedTask.id,
        createTaskDto as unknown as Record<string, unknown>,
      );

      return savedTask;
    } catch (error) {
      this.logger.error(
        `Error al crear tarea para usuario ${userId}: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async findAll(
    userId: string,
    page = 1,
    limit = 10,
    status?: string,
    startDate?: string,
    endDate?: string,
    responsible?: string,
    tags?: string,
    orderBy = 'createdAt',
    orderDirection: 'ASC' | 'DESC' = 'DESC',
  ) {
    const skip = (page - 1) * limit;

    const queryBuilder = this.tasksRepository.createQueryBuilder('task').where(
      new Brackets((qb) => {
        qb.where('task.userId = :userId', { userId }).orWhere(
          'task.isPublic = :isPublic',
          { isPublic: true },
        );
      }),
    );

    // Aplicar filtros
    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'task.deliveryDate BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    }

    if (responsible) {
      queryBuilder.andWhere('task.responsible = :responsible', { responsible });
    }

    if (tags) {
      const tagsArray = tags.split(',').map((t) => t.trim());
      queryBuilder.andWhere('FIND_IN_SET(:tag, task.tags)', {
        tag: tagsArray[0],
      });
    }

    // Aplicar ordenamiento
    const validOrderFields = [
      'createdAt',
      'deliveryDate',
      'status',
      'title',
      'updatedAt',
    ];
    const safeOrderBy = validOrderFields.includes(orderBy)
      ? orderBy
      : 'createdAt';
    queryBuilder.orderBy(`task.${safeOrderBy}`, orderDirection);

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      filters: { status, startDate, endDate, responsible, tags },
      sorting: { orderBy: safeOrderBy, orderDirection },
    };
  }

  async findOne(id: number, userId?: string) {
    const task = await this.tasksRepository.findOneBy({ id });
    if (!task) throw new NotFoundException(`Task #${id} not found`);

    // Validar acceso
    if (!task.isPublic && userId && task.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para ver esta tarea');
    }

    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, userId: string) {
    const task = await this.findOne(id);

    // Validar autorización: solo propietario de tareas privadas, cualquiera para públicas
    if (!task.isPublic && task.userId !== userId) {
      throw new ForbiddenException(
        'Solo puedes actualizar tus propias tareas privadas',
      );
    }

    await this.tasksRepository.update(id, updateTaskDto);

    // Registra la operación de actualización en el registro de auditoría
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

    // Validar autorización: solo propietario de tareas privadas, cualquiera para públicas
    if (!task.isPublic && task.userId !== userId) {
      throw new ForbiddenException(
        'Solo puedes eliminar tus propias tareas privadas',
      );
    }

    await this.tasksRepository.delete(id);

    // Registra el evento de eliminación con metadatos relevantes de la tarea
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
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error al cargar archivo para task ${id} por usuario ${userId}: ${msg}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Re-lanzar excepciones específicas para mantener el código HTTP correcto
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException(`Error al cargar archivo: ${msg}`);
    }
  }
}
