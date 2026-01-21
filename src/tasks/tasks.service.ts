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

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    private readonly auditService: AuditService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string) {
    const task = this.tasksRepository.create({
      ...createTaskDto,
      userId,
    });

    const savedTask = await this.tasksRepository.save(task);

    // Registro automático en auditoría
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

    // Mostrar tareas propias + tareas públicas de otros
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
    const task = await this.findOne(id); // Valida existencia

    // Validar que el usuario sea el propietario
    if (task.userId !== userId) {
      throw new ForbiddenException('You can only update your own tasks');
    }

    await this.tasksRepository.update(id, updateTaskDto);

    await this.auditService.logAction(
      userId,
      'UPDATE_TASK',
      id,
      updateTaskDto as unknown as Record<string, unknown>,
    );

    return await this.findOne(id);
  }

  async remove(id: number, userId: string) {
    const task = await this.findOne(id); // Valida existencia y obtiene datos para el log

    // Validar que el usuario sea el propietario
    if (task.userId !== userId) {
      throw new ForbiddenException('You can only delete your own tasks');
    }

    await this.tasksRepository.delete(id);

    await this.auditService.logAction(userId, 'DELETE_TASK', id, {
      title: task.title,
    });

    return { message: 'Task deleted successfully' };
  }
}
