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

    // Log the task creation event with the provided payload for audit trail compliance
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

    // Retrieve paginated results: user's private tasks combined with all public tasks from other users
    // This implements the role-based visibility model where users can see their own tasks and any public tasks
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

    // Enforce resource ownership: verify that the requesting user is the task owner before allowing modifications
    if (task.userId !== userId) {
      throw new ForbiddenException('You can only update your own tasks');
    }

    await this.tasksRepository.update(id, updateTaskDto);

    // Record the update operation in the audit log for compliance and debugging purposes
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

    // Enforce resource ownership: verify task ownership before deletion to prevent unauthorized deletions
    if (task.userId !== userId) {
      throw new ForbiddenException('You can only delete your own tasks');
    }

    await this.tasksRepository.delete(id);

    // Record the deletion event with relevant task metadata for historical tracking
    await this.auditService.logAction(userId, 'DELETE_TASK', id, {
      title: task.title,
    });

    return { message: 'Task deleted successfully' };
  }
}
