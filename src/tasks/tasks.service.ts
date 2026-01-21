import { Injectable, NotFoundException } from '@nestjs/common';
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
      createTaskDto,
    );

    return savedTask;
  }

  async findAll() {
    return await this.tasksRepository.find();
  }

  async findOne(id: number) {
    const task = await this.tasksRepository.findOneBy({ id });
    if (!task) throw new NotFoundException(`Task #${id} not found`);
    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, userId: string) {
    await this.findOne(id); // Valida existencia

    await this.tasksRepository.update(id, updateTaskDto);

    await this.auditService.logAction(userId, 'UPDATE_TASK', id, updateTaskDto);

    return await this.findOne(id);
  }

  async remove(id: number, userId: string) {
    const task = await this.findOne(id); // Valida existencia y obtiene datos para el log

    await this.tasksRepository.delete(id);

    await this.auditService.logAction(userId, 'DELETE_TASK', id, {
      title: task.title,
    });

    return { message: 'Task deleted successfully' };
  }
}
