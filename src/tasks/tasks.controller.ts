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
 * TasksController
 *
 * Handles HTTP requests for task management operations. Implements RESTful endpoints
 * for CRUD operations with user context extraction from the 'x-user-id' header.
 */
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   * POST /tasks
   * Creates a new task for the authenticated user.
   * The task is assigned to the user specified in the 'x-user-id' header.
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
   * Retrieves paginated list of tasks visible to the user (own tasks + public tasks from others).
   * Supports pagination via query parameters.
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
   * Retrieves a specific task by its ID.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(+id);
  }

  /**
   * PATCH /tasks/:id
   * Updates a task with partial modifications. Only the task owner can perform this operation.
   * Returns ForbiddenException if user is not the task owner.
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
   * Removes a task from the system. Only the task owner can delete their own tasks.
   * Returns ForbiddenException if user is not the task owner.
   */
  @Delete(':id')
  remove(@Param('id') id: string, @Headers('x-user-id') userId?: string) {
    return this.tasksService.remove(+id, userId ?? 'system');
  }
}
